import argparse
import re
import pandas as pd
from pathlib import Path
from sklearn.model_selection import train_test_split
from loguru import logger


BULLISH_KEYWORDS = ["record revenue", "exceeded", "raised guidance", "above consensus", "strong growth", "beat estimates", "expanding margins"]
BEARISH_KEYWORDS = ["missed estimates", "below expectations", "lowered guidance", "workforce reduction", "restructuring", "margin compression", "suspended dividend"]


def clean_transcript(text: str) -> str:
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"[^\x00-\x7F]+", "", text)
    filler = r"\b(um|uh|er|you know|like i said|as i mentioned)\b"
    text = re.sub(filler, "", text, flags=re.IGNORECASE)
    text = text.strip()
    return text


def heuristic_label(text: str) -> str:
    t = text.lower()
    pos = sum(1 for k in BULLISH_KEYWORDS if k in t)
    neg = sum(1 for k in BEARISH_KEYWORDS if k in t)
    if pos > neg and pos > 0:
        return "positive"
    if neg > pos and neg > 0:
        return "negative"
    return "neutral"


def prepare(args):
    raw_path = Path(args.input)
    out_dir = Path(args.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    if raw_path.suffix == ".csv":
        df = pd.read_csv(raw_path)
    elif raw_path.suffix == ".json":
        df = pd.read_json(raw_path)
    else:
        raise ValueError(f"Unsupported file format: {raw_path.suffix}")

    assert "text" in df.columns, "Input must have a 'text' column"
    logger.info(f"Loaded {len(df)} samples")

    df["text"] = df["text"].apply(clean_transcript)
    df = df[df["text"].str.len() > 100].copy()
    logger.info(f"After cleaning: {len(df)} samples")

    if "label" not in df.columns:
        logger.warning("No 'label' column found — applying heuristic labels")
        df["label"] = df["text"].apply(heuristic_label)

    label_counts = df["label"].value_counts()
    logger.info(f"Label distribution:\n{label_counts}")

    train_df, val_df = train_test_split(df, test_size=0.2, random_state=42, stratify=df["label"])
    train_df.to_csv(out_dir / "train.csv", index=False)
    val_df.to_csv(out_dir / "val.csv", index=False)
    df.to_csv(out_dir / "transcripts.csv", index=False)
    logger.info(f"Saved processed data to {out_dir}")
    logger.info(f"Train: {len(train_df)} | Val: {len(val_df)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Prepare earnings transcript dataset")
    parser.add_argument("--input", required=True, help="Path to raw CSV or JSON")
    parser.add_argument("--output-dir", default="../data/processed")
    args = parser.parse_args()
    prepare(args)
