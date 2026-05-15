import os
import json
from google import genai

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

SYSTEM_PROMPT = """
You are a review moderation classifier.

Classify the review into one of these labels only:
- Likely Genuine
- Suspicious
- Likely Manipulated

Return valid JSON with exactly these fields:
{
  "authenticity_label": "Likely Genuine | Suspicious | Likely Manipulated",
  "text_suspicion_score": 0.0,
  "reason": "short reason"
}

Scoring rules:
- 0.0 to 0.39 => Likely Genuine
- 0.40 to 0.69 => Suspicious
- 0.70 to 1.00 => Likely Manipulated

Judge based on:
- promotional exaggeration
- unnatural language
- repeated marketing tone
- deceptive persuasion
- overly generic praise/criticism
- manipulative fake-review style

Return JSON only.
"""

def classify_review_text(review_text: str):
    prompt = f"{SYSTEM_PROMPT}\n\nReview:\n{review_text}"

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
    )

    text = response.text.strip()
    return json.loads(text)