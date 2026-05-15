from fastapi import APIRouter, UploadFile, File, HTTPException
import pandas as pd
import os
import json
from dotenv import load_dotenv
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.neighbors import NearestNeighbors

load_dotenv()

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

REQUIRED_COLUMNS = [
    "product_id",
    "user_id",
    "review_text",
    "timestamp",
    "rating",
    "verified_purchase",
]

# ---------- Gemini setup ----------
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
gemini_client = None

if GEMINI_API_KEY:
    try:
        from google import genai
        gemini_client = genai.Client(api_key=GEMINI_API_KEY)
    except Exception:
        gemini_client = None


# ---------- Helpers ----------
def normalize_verified_purchase(value) -> bool:
    if isinstance(value, bool):
        return value
    s = str(value).strip().lower()
    return s in {"true", "1", "yes", "y"}


def heuristic_text_score(review_text: str) -> dict:
    """
    Fallback if Gemini is unavailable.
    """
    text = str(review_text).lower()
    score = 0.0

    suspicious_phrases = [
        "best product ever",
        "worst product ever",
        "must buy",
        "highly recommended",
        "do not buy",
        "fake",
        "scam",
        "amazing product",
        "terrible product",
        "five stars",
        "one star",
    ]

    for phrase in suspicious_phrases:
        if phrase in text:
            score += 0.12

    if len(text.split()) < 4:
        score += 0.10

    score = min(score, 1.0)

    if score >= 0.70:
        label = "Likely Manipulated"
        message = "The review appears authentic and reflects a natural user experience. It shows realistic language patterns with no strong signs of manipulation or coordinated behavior."
    elif score >= 0.40:
        label = "Suspicious"
        message="Some aspects of this review appear unusual compared to normal user behavior.Additional validation may be helpful before fully trusting this content."
    else:
        label = "Likely Genuine"
        message= 'The structure and signals in this review closely match known spam or coordinated patterns.It is likely not an authentic individual user experience.'

    return {
        "authenticity_label": label,
        "text_suspicion_score": round(score, 3),
        "reason": message,
    }


def classify_review_text_with_gemini(review_text: str) -> dict:
    """
    Uses Gemini if API key is available; otherwise falls back to heuristics.
    """
    if not gemini_client:
        return heuristic_text_score(review_text)

    prompt = f"""
You are a review moderation classifier.

Classify the following review into exactly one label:
- Likely Genuine
- Suspicious
- Likely Manipulated

Return STRICT JSON only with this exact structure:
{{
  "authenticity_label": "Likely Genuine | Suspicious | Likely Manipulated",
  "text_suspicion_score": 0.0,
  "reason": "short explanation"
}}

Scoring guidance:
- 0.00 to 0.39 => Likely Genuine
- 0.40 to 0.69 => Suspicious
- 0.70 to 1.00 => Likely Manipulated

Focus on:
- unnatural promotional tone
- generic exaggerated praise/criticism
- manipulative fake-review style
- deceptive persuasion
- templated or suspicious wording

Review:
\"\"\"{review_text}\"\"\"
""".strip()

    try:
        response = gemini_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config={"response_mime_type": "application/json"},
        )

        raw_text = response.text.strip()
        parsed = json.loads(raw_text)

        label = parsed.get("authenticity_label", "Suspicious")
        score = float(parsed.get("text_suspicion_score", 0.5))
        reason = str(parsed.get("reason", "No reason provided"))

        if label not in {"Likely Genuine", "Suspicious", "Likely Manipulated"}:
            label = "Suspicious"

        score = max(0.0, min(1.0, score))

        return {
            "authenticity_label": label,
            "text_suspicion_score": round(score, 3),
            "reason": reason,
        }

    except Exception:
        return heuristic_text_score(review_text)


def action_from_score(final_score: float) -> tuple[str, str]:
    if final_score >= 0.80:
        return "Likely Manipulated", "Escalate to Moderation Team"
    elif final_score >= 0.60:
        return "Suspicious", "Restrict User"
    elif final_score >= 0.40:
        return "Suspicious", "Verify User"
    else:
        return "Likely Genuine", "Approved"


def compute_duplicate_scores(texts: list[str], k_neighbors: int = 6) -> list[float]:
    """
    Optimized duplicate detection:
    - Uses TF-IDF
    - Uses NearestNeighbors instead of full NxN cosine matrix
    - Returns the best similarity score for each review

    This avoids materializing a full similarity matrix in memory.
    """
    if len(texts) <= 1:
        return [0.0 for _ in texts]

    cleaned_texts = [str(t).strip().lower() for t in texts]

    vectorizer = TfidfVectorizer(
        stop_words="english",
        ngram_range=(1, 2),
        min_df=1,
        max_df=0.95,
    )
    tfidf_matrix = vectorizer.fit_transform(cleaned_texts)

    n_neighbors = min(k_neighbors, len(cleaned_texts))

    model = NearestNeighbors(
        n_neighbors=n_neighbors,
        metric="cosine",
        algorithm="brute",
    )
    model.fit(tfidf_matrix)

    distances, indices = model.kneighbors(tfidf_matrix)

    duplicate_scores = []

    for i in range(len(cleaned_texts)):
        best_similarity = 0.0

        for dist, idx in zip(distances[i], indices[i]):
            if idx == i:
                continue

            similarity = 1.0 - float(dist)
            if similarity > best_similarity:
                best_similarity = similarity

        duplicate_scores.append(round(max(0.0, min(1.0, best_similarity)), 3))

    return duplicate_scores


# ---------- Main Route ----------
@router.post("/upload")
async def upload_csv(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")

    file_path = os.path.join(UPLOAD_DIR, file.filename)

    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)

    try:
        df = pd.read_csv(file_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid CSV file: {e}")

    missing = [col for col in REQUIRED_COLUMNS if col not in df.columns]
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required columns: {', '.join(missing)}",
        )

    df = df.copy()
    df["review_text"] = df["review_text"].fillna("").astype(str)
    df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
    df["rating"] = pd.to_numeric(df["rating"], errors="coerce").fillna(0).astype(int)
    df["verified_purchase"] = df["verified_purchase"].apply(normalize_verified_purchase)

    if df["timestamp"].isna().any():
        raise HTTPException(status_code=400, detail="Some timestamp values are invalid")

    invalid_ratings = ~df["rating"].between(1, 5)
    if invalid_ratings.any():
        raise HTTPException(status_code=400, detail="Ratings must be between 1 and 5")

    # ---- Duplicate similarity (optimized) ----
    review_texts = df["review_text"].tolist()
    df["duplicate_score"] = compute_duplicate_scores(review_texts, k_neighbors=6)

    df["is_extreme_rating"] = df["rating"].isin([1, 5])
    df["is_unverified"] = ~df["verified_purchase"]

    # ---- User-level features ----
    user_counts = df.groupby("user_id").size().to_dict()
    unverified_ratio = df.groupby("user_id")["is_unverified"].mean().to_dict()
    extreme_ratio = df.groupby("user_id")["is_extreme_rating"].mean().to_dict()
    avg_duplicate_ratio = df.groupby("user_id")["duplicate_score"].mean().to_dict()

    user_summary = {}

    for user_id in user_counts:
        signals = 0

        if user_counts[user_id] >= 5:
            signals += 1
        if unverified_ratio[user_id] >= 0.8:
            signals += 1
        if avg_duplicate_ratio[user_id] >= 0.88:
            signals += 1
        if extreme_ratio[user_id] >= 0.8:
            signals += 1

        spam_flag = signals >= 2

        if signals >= 3:
            user_action = "Restrict User"
        elif signals == 2:
            user_action = "Verify User"
        else:
            user_action = "Approved"

        user_summary[user_id] = {
            "user_id": user_id,
            "review_count": int(user_counts[user_id]),
            "unverified_ratio": round(float(unverified_ratio[user_id]), 3),
            "extreme_rating_ratio": round(float(extreme_ratio[user_id]), 3),
            "duplicate_ratio": round(float(avg_duplicate_ratio[user_id]), 3),
            "spam_reviewing_flag": bool(spam_flag),
            "user_action": user_action,
        }

    # ---- Product-level bombing detection ----
    df["time_bucket_10min"] = df["timestamp"].dt.floor("10min")
    product_bombing_flags = {}
    product_summaries = []

    for product_id, group in df.groupby("product_id"):
        window_counts = group.groupby("time_bucket_10min").size()
        max_burst = int(window_counts.max()) if not window_counts.empty else 0
        extreme_ratio_product = float(group["is_extreme_rating"].mean())
        total_reviews_product = int(len(group))
        unique_users = int(group["user_id"].nunique())

        bombing = (
            total_reviews_product >= 5
            and max_burst >= 4
            and extreme_ratio_product >= 0.75
            and unique_users >= 3
        )

        product_bombing_flags[product_id] = bool(bombing)

        product_summaries.append({
            "product_id": product_id,
            "review_count": total_reviews_product,
            "burst_score": round(float(max_burst / max(total_reviews_product, 1)), 3),
            "extreme_ratio": round(extreme_ratio_product, 3),
            "bombing_flag": bool(bombing),
            "campaign_cluster_count": int((group["duplicate_score"] >= 0.88).sum()),
        })

    # ---- Review-level results ----
    review_results = []

    for _, row in df.iterrows():
        gemini_result = classify_review_text_with_gemini(row["review_text"])
        text_suspicion_score = float(gemini_result["text_suspicion_score"])
        text_label = gemini_result["authenticity_label"]
        reason = gemini_result["reason"]

        duplicate_score = float(row["duplicate_score"])
        bombing_flag = product_bombing_flags.get(row["product_id"], False)
        spam_flag = user_summary[row["user_id"]]["spam_reviewing_flag"]

        bombing_score = 1.0 if bombing_flag else 0.0
        spam_user_score = 1.0 if spam_flag else 0.0

        final_score = (
            0.45 * text_suspicion_score
            + 0.25 * duplicate_score
            + 0.15 * bombing_score
            + 0.15 * spam_user_score
        )

        final_score = round(min(max(final_score, 0.0), 1.0), 3)

        authenticity_label, recommended_action = action_from_score(final_score)

        review_results.append({
            "product_id": row["product_id"],
            "user_id": row["user_id"],
            "review_text": row["review_text"],
            "timestamp": str(row["timestamp"]),
            "rating": int(row["rating"]),
            "verified_purchase": bool(row["verified_purchase"]),
            "text_authenticity_label": text_label,
            "authenticity_label": authenticity_label,
            "text_suspicion_score": round(text_suspicion_score, 3),
            "duplicate_campaign_score": round(duplicate_score, 3),
            "bombing_flag": bool(bombing_flag),
            "spam_reviewing_flag": bool(spam_flag),
            "suspicious_review_score": final_score,
            "recommended_action": recommended_action,
            "reason": reason,
        })

    total_flagged_reviews = sum(
        1 for r in review_results if r["authenticity_label"] != "Likely Genuine"
    )
    total_flagged_users = sum(
        1 for u in user_summary.values() if u["spam_reviewing_flag"]
    )
    total_bombing_products = sum(1 for v in product_bombing_flags.values() if v)

    return {
        "filename": file.filename,
        "total_reviews": int(len(df)),
        "total_flagged_reviews": int(total_flagged_reviews),
        "total_flagged_users": int(total_flagged_users),
        "total_bombing_products": int(total_bombing_products),
        "review_results": review_results,
        "user_summaries": list(user_summary.values()),
        "product_summaries": product_summaries,
        "model_used_for_text": "gemini-2.5-flash" if gemini_client else "heuristic-fallback",
        "duplicate_method": "tfidf+nearest-neighbors",
    }