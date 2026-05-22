"""
Resumy API - Inference Server
CV <-> Job Description Match Prediction menggunakan FastAPI.
"""

import os
import logging
import sys

import numpy as np
import joblib
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sklearn.metrics.pairwise import cosine_similarity

# ---------------------------------------------------------------------------
# Console encoding
# ---------------------------------------------------------------------------
for stream_name in ("stdout", "stderr"):
    stream = getattr(sys, stream_name, None)
    if hasattr(stream, "reconfigure"):
        stream.reconfigure(encoding="utf-8", errors="replace")

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Path artefak
# ---------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")

MODEL_PATH = os.path.join(MODELS_DIR, "resumy_micro_mlp.keras")
TFIDF_PATH = os.path.join(MODELS_DIR, "tfidf_vectorizer.pkl")
SCALER_PATH = os.path.join(MODELS_DIR, "scaler.pkl")

# ---------------------------------------------------------------------------
# Global holders - diisi saat startup
# ---------------------------------------------------------------------------
model = None
tfidf_vectorizer = None
scaler = None

# ---------------------------------------------------------------------------
# FastAPI App
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Resumy API",
    description="CV <-> Job Description Match Prediction Server",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Startup - muat artefak ke memori
# ---------------------------------------------------------------------------
@app.on_event("startup")
async def load_artifacts():
    """Memuat model Keras, TF-IDF vectorizer, dan scaler ke memori global."""
    global model, tfidf_vectorizer, scaler

    # --- Keras model ---
    try:
        from tensorflow.keras.models import load_model  # noqa: WPS433

        model = load_model(MODEL_PATH)
        logger.info("[OK] Model Keras berhasil dimuat dari %s", MODEL_PATH)
    except Exception as exc:
        logger.error("[ERROR] Gagal memuat model Keras: %s", exc)
        raise RuntimeError(f"Gagal memuat model Keras: {exc}") from exc

    # --- TF-IDF vectorizer ---
    try:
        tfidf_vectorizer = joblib.load(TFIDF_PATH)
        logger.info("[OK] TF-IDF vectorizer berhasil dimuat dari %s", TFIDF_PATH)
    except Exception as exc:
        logger.error("[ERROR] Gagal memuat TF-IDF vectorizer: %s", exc)
        raise RuntimeError(f"Gagal memuat TF-IDF vectorizer: {exc}") from exc

    # --- Scaler ---
    try:
        scaler = joblib.load(SCALER_PATH)
        logger.info("[OK] Scaler berhasil dimuat dari %s", SCALER_PATH)
    except Exception as exc:
        logger.error("[ERROR] Gagal memuat Scaler: %s", exc)
        raise RuntimeError(f"Gagal memuat Scaler: {exc}") from exc


# ---------------------------------------------------------------------------
# Pydantic schema
# ---------------------------------------------------------------------------
class MatchRequest(BaseModel):
    """Body request untuk endpoint /predict."""

    cv_text: str
    job_desc_text: str


# ---------------------------------------------------------------------------
# Feature extraction helper
# ---------------------------------------------------------------------------
def extract_single_pair_features(
    cv_text: str,
    jd_text: str,
    tfidf_model,
) -> np.ndarray:
    """Menghitung 4 metrik numerik dari sepasang teks CV & Job Description.

    Metrik yang dihitung:
        1. Jaccard Similarity
        2. Length Ratio  (len CV tokens / len JD tokens)
        3. Absolute Word Count Difference
        4. TF-IDF Cosine Similarity

    Returns:
        numpy array berdimensi (1, 4).
    """
    # Tokenisasi sederhana: lowercase -> split whitespace
    cv_tokens = cv_text.lower().split()
    jd_tokens = jd_text.lower().split()

    cv_set = set(cv_tokens)
    jd_set = set(jd_tokens)

    # 1) Jaccard Similarity
    intersection = cv_set & jd_set
    union = cv_set | jd_set
    jaccard = len(intersection) / len(union) if union else 0.0

    # 2) Length Ratio
    length_ratio = len(cv_tokens) / len(jd_tokens) if jd_tokens else 0.0

    # 3) Absolute Word Count Difference
    abs_word_diff = abs(len(cv_tokens) - len(jd_tokens))

    # 4) TF-IDF Cosine Similarity
    tfidf_matrix = tfidf_model.transform([cv_text.lower(), jd_text.lower()])
    tfidf_cos_sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0, 0]

    features = np.array(
        [[jaccard, length_ratio, abs_word_diff, tfidf_cos_sim]],
        dtype=np.float64,
    )
    return features  # shape (1, 4)


# ---------------------------------------------------------------------------
# Endpoint: POST /predict
# ---------------------------------------------------------------------------
@app.post("/predict")
async def predict(payload: MatchRequest):
    """Memprediksi persentase kecocokan antara CV dan Job Description."""

    # Guard - pastikan artefak sudah dimuat
    if model is None or tfidf_vectorizer is None or scaler is None:
        raise HTTPException(
            status_code=503,
            detail="Artefak ML belum dimuat. Server belum siap.",
        )

    # Validasi input tidak kosong
    if not payload.cv_text.strip() or not payload.job_desc_text.strip():
        raise HTTPException(
            status_code=422,
            detail="cv_text dan job_desc_text tidak boleh kosong.",
        )

    try:
        # 1) Ekstrak 4 fitur mentah
        raw_features = extract_single_pair_features(
            payload.cv_text,
            payload.job_desc_text,
            tfidf_vectorizer,
        )

        # 2) Normalisasi dengan scaler
        scaled_features = scaler.transform(raw_features)

        # 3) Prediksi
        prediction = model.predict(scaled_features, verbose=0)
        match_percentage = float(np.clip(prediction[0][0] * 100, 0, 100))

        # 4) Response
        return {
            "success": True,
            "match_percentage": round(match_percentage, 2),
            "extracted_features": {
                "jaccard_similarity": round(float(raw_features[0, 0]), 6),
                "length_ratio": round(float(raw_features[0, 1]), 6),
                "abs_word_count_diff": int(raw_features[0, 2]),
                "tfidf_cosine_similarity": round(float(raw_features[0, 3]), 6),
            },
        }

    except Exception as exc:
        logger.error("Prediction error: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Terjadi kesalahan saat prediksi: {exc}",
        ) from exc
