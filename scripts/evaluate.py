import argparse
import json
import numpy as np
import pandas as pd
import torch
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
from sklearn.metrics import classification_report, confusion_matrix
from transformers import LongformerTokenizer, LongformerForSequenceClassification
from torch.utils.data import Dataset, DataLoader
from loguru import logger


LABEL_MAP = {"negative": 0, "neutral": 1, "positive": 2}
REVERSE_MAP = {v: k for k, v in LABEL_MAP.items()}


class EvalDataset(Dataset):
    def __init__(self, texts, labels, tokenizer, max_length):
        self.encodings = tokenizer(texts, truncation=True, padding=True, max_length=max_length, return_tensors="pt")
        self.labels = torch.tensor(labels, dtype=torch.long)

    def __len__(self):
        return len(self.labels)

    def __getitem__(self, idx):
        item = {k: v[idx] for k, v in self.encodings.items()}
        item["labels"] = self.labels[idx]
        return item


def evaluate(args):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model_path = args.model_path

    tokenizer = LongformerTokenizer.from_pretrained(model_path)
    model = LongformerForSequenceClassification.from_pretrained(model_path).to(device)
    model.eval()

    df = pd.read_csv(args.data)
    texts = df["text"].tolist()
    labels = df["label"].map(LABEL_MAP).tolist()

    dataset = EvalDataset(texts, labels, tokenizer, args.max_length)
    loader = DataLoader(dataset, batch_size=args.batch_size)

    all_preds, all_labels = [], []
    with torch.no_grad():
        for batch in loader:
            batch = {k: v.to(device) for k, v in batch.items()}
            outputs = model(**batch)
            preds = torch.argmax(outputs.logits, dim=-1).cpu().tolist()
            all_preds.extend(preds)
            all_labels.extend(batch["labels"].cpu().tolist())

    report = classification_report(all_labels, all_preds, target_names=["negative", "neutral", "positive"])
    print("\n" + "=" * 60)
    print("CLASSIFICATION REPORT")
    print("=" * 60)
    print(report)

    report_dict = classification_report(all_labels, all_preds, target_names=["negative", "neutral", "positive"], output_dict=True)
    out_dir = Path(args.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    with open(out_dir / "eval_metrics.json", "w") as f:
        json.dump(report_dict, f, indent=2)

    cm = confusion_matrix(all_labels, all_preds)
    fig, ax = plt.subplots(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt="d", cmap="RdYlGn", xticklabels=["negative","neutral","positive"], yticklabels=["negative","neutral","positive"], ax=ax)
    ax.set_xlabel("Predicted")
    ax.set_ylabel("Actual")
    ax.set_title("Confusion Matrix — Longformer Earnings Sentiment")
    plt.tight_layout()
    plt.savefig(out_dir / "confusion_matrix.png", dpi=150)
    logger.info(f"Saved confusion matrix to {out_dir}/confusion_matrix.png")
    logger.info(f"Saved metrics to {out_dir}/eval_metrics.json")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--model-path", required=True)
    parser.add_argument("--data", required=True)
    parser.add_argument("--output-dir", default="../data/eval_output")
    parser.add_argument("--batch-size", type=int, default=8)
    parser.add_argument("--max-length", type=int, default=4096)
    args = parser.parse_args()
    evaluate(args)
