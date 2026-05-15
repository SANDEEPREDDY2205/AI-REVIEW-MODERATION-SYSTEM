from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
import json
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from langdetect import detect, LangDetectException

load_dotenv()

router = APIRouter()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
gemini_client = None

if GEMINI_API_KEY:
    try:
        from google import genai
        gemini_client = genai.Client(api_key=GEMINI_API_KEY)
    except Exception:
        gemini_client = None


class UrlRequest(BaseModel):
    url: str


def clean_review_text(text: str) -> str:
    cleaned = " ".join(text.split()).strip()

    phrases_to_remove = [
        "read more",
        "read less",
        "show more",
        "show less",
        "see more",
        "see less",
    ]

    lower_cleaned = cleaned.lower()
    for phrase in phrases_to_remove:
        lower_cleaned = lower_cleaned.replace(phrase, "")

    cleaned = " ".join(lower_cleaned.split()).strip()
    return cleaned


def extract_reviews_from_url(url: str) -> list[str]:
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36"
    }

    response = requests.get(url, headers=headers, timeout=15)
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")

    for tag in soup(["script", "style", "noscript", "header", "footer", "nav"]):
        tag.decompose()

    candidate_selectors = [
        '[data-hook="review-body"]',
        ".review-text",
        ".review-content",
        ".review-body",
        ".comment-content",
        ".comments-content",
        ".user-review",
        ".review",
        "article",
        "p",
    ]

    reviews = []

    for selector in candidate_selectors:
        elements = soup.select(selector)
        for el in elements:
            text = el.get_text(" ", strip=True)
            text = clean_review_text(text)

            if len(text.split()) >= 5 and text not in reviews:
                reviews.append(text)

        if len(reviews) >= 15:
            break

    return reviews[:10]


def detect_language(text: str) -> str:
    try:
        return detect(text)
    except LangDetectException:
        return "unknown"


def heuristic_single_review_analysis(text: str) -> dict:
    suspicious_terms = [
        "best product ever",
        "must buy",
        "highly recommended",
        "worst product ever",
        "do not buy",
        "fake",
        "scam",
        "terrible product",
        "amazing product",
    ]

    lower = text.lower()
    score = 0.0

    for term in suspicious_terms:
        if term in lower:
            score += 0.12

    if len(lower.split()) < 4:
        score += 0.08

    score = min(score, 1.0)

    if score >= 0.7:
        verdict = "Likely Manipulated"
        explanation = "The structure and signals in this review closely match known spam or coordinated patterns.It is likely not an authentic individual user experience."
    elif score >= 0.4:
        verdict = "Suspicious"
        explanation = "Some aspects of this review appear unusual compared to normal user behavior.Additional validation may be helpful before fully trusting this content."
    else:
        verdict = "Likely Genuine"
        explanation = "The content reads naturally and aligns with typical user feedback patterns.No significant risk signals were detected during analysis."

    return {
        "verdict": verdict,
        "score": round(score, 3),
        "explanation": explanation,
        "model_used": "heuristic-fallback",
    }


def analyze_single_review_with_gemini(text: str) -> dict:
    if not gemini_client:
        return heuristic_single_review_analysis(text)

    prompt = f"""
You are a review authenticity analyzer.

Classify this single review into exactly one:
- Likely Genuine
- Suspicious
- Likely Manipulated

Return STRICT JSON only in this format:
{{
  "verdict": "Likely Genuine | Suspicious | Likely Manipulated",
  "score": 0.0,
  "explanation": "short simple 1-2 line explanation"
}}

Scoring:
- 0.00 to 0.39 => Likely Genuine
- 0.40 to 0.69 => Suspicious
- 0.70 to 1.00 => Likely Manipulated

Review:
\"\"\"{text}\"\"\"
""".strip()

    try:
        response = gemini_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config={"response_mime_type": "application/json"},
        )

        parsed = json.loads(response.text.strip())

        verdict = parsed.get("verdict", "Suspicious")
        score = float(parsed.get("score", 0.5))
        explanation = parsed.get(
            "explanation",
            "This review was analyzed using Gemini and appears moderately suspicious."
        )

        if verdict not in {"Likely Genuine", "Suspicious", "Likely Manipulated"}:
            verdict = "Suspicious"

        score = max(0.0, min(1.0, score))

        return {
            "verdict": verdict,
            "score": round(score, 3),
            "explanation": explanation,
            "model_used": "gemini-2.5-flash",
        }
    except Exception:
        return heuristic_single_review_analysis(text)


@router.post("/analyze-url")
def analyze_url(payload: UrlRequest):
    try:
        reviews = extract_reviews_from_url(payload.url)

        if not reviews:
            return {
                "success": False,
                "url": payload.url,
                "message": "Could not extract enough review text from this page.",
                "results": [],
            }

        results = []

        for review in reviews:
            language = detect_language(review)

            if language != "en":
                results.append({
                    "review_text": review,
                    "verdict": "Language Not Supported",
                    "score": 0.0,
                    "explanation": "This review content appears to be in another language.",
                    "model_used": "none",
                    "detected_language": language,
                })
                continue

            analysis = analyze_single_review_with_gemini(review)

            results.append({
                "review_text": review,
                "verdict": analysis["verdict"],
                "score": analysis["score"],
                "explanation": analysis["explanation"],
                "model_used": analysis["model_used"],
                "detected_language": "en",
            })

        return {
            "success": True,
            "url": payload.url,
            "message": "URL analysis completed successfully.",
            "results": results,
        }

    except requests.RequestException:
        return {
            "success": False,
            "url": payload.url,
            "message": "Failed to access the URL.",
            "results": [],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"URL analysis failed: {str(e)}")