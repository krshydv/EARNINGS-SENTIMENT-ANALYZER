import argparse
import os
import json
from pathlib import Path

import torch
import numpy as np
import pandas as pd
from torch.utils.data import Dataset, DataLoader
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix
from transformers import (
    LongformerTokenizer,
    LongformerForSequenceClassification,
    get_linear_schedule_with_warmup,
)
from torch.optim import AdamW
from loguru import logger


LABEL_MAP = {"negative": 0, "neutral": 1, "positive": 2}
REVERSE_MAP = {v: k for k, v in LABEL_MAP.items()}


class EarningsDataset(Dataset):
    def __init__(self, texts, labels, tokenizer, max_length):
        self.encodings = tokenizer(
            texts,
            truncation=True,
            padding=True,
            max_length=max_length,
            return_tensors="pt",
        )
        self.labels = torch.tensor(labels, dtype=torch.long)

    def __len__(self):
        return len(self.labels)

    def __getitem__(self, idx):
        item = {k: v[idx] for k, v in self.encodings.items()}
        item["labels"] = self.labels[idx]
        return item


def load_data(data_path: str) -> tuple[list[str], list[int]]:
    df = pd.read_csv(data_path)
    assert "text" in df.columns and "label" in df.columns, "CSV must have 'text' and 'label' columns"
    texts = df["text"].tolist()
    labels = df["label"].map(LABEL_MAP).tolist()
    return texts, labels


def train(args):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"Training on device: {device}")

    texts, labels = load_data(args.data)
    X_train, X_val, y_train, y_val = train_test_split(texts, labels, test_size=0.2, random_state=42, stratify=labels)
    logger.info(f"Train: {len(X_train)} | Val: {len(X_val)}")

    tokenizer = LongformerTokenizer.from_pretrained(args.model)
    model = LongformerForSequenceClassification.from_pretrained(args.model, num_labels=3).to(device)

    train_ds = EarningsDataset(X_train, y_train, tokenizer, args.max_length)
    val_ds = EarningsDataset(X_val, y_val, tokenizer, args.max_length)
    train_loader = DataLoader(train_ds, batch_size=args.batch_size, shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=args.batch_size)

    optimizer = AdamW(model.parameters(), lr=args.lr, weight_decay=0.01)
    total_steps = len(train_loader) * args.epochs
    scheduler = get_linear_schedule_with_warmup(optimizer, num_warmup_steps=total_steps // 10, num_training_steps=total_steps)

    best_val_f1 = 0.0
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    for epoch in range(1, args.epochs + 1):
        model.train()
        total_loss = 0
        for batch in train_loader:
            batch = {k: v.to(device) for k, v in batch.items()}
            outputs = model(**batch)
            loss = outputs.loss
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            scheduler.step()
            optimizer.zero_grad()
            total_loss += loss.item()
        avg_loss = total_loss / len(train_loader)

        model.eval()
        all_preds, all_labels = [], []
        with torch.no_grad():
            for batch in val_loader:
                batch = {k: v.to(device) for k, v in batch.items()}
                outputs = model(**batch)
                preds = torch.argmax(outputs.logits, dim=-1).cpu().tolist()
                all_preds.extend(preds)
                all_labels.extend(batch["labels"].cpu().tolist())

        report = classification_report(all_labels, all_preds, target_names=["negative", "neutral", "positive"], output_dict=True)
        val_f1 = report["weighted avg"]["f1-score"]
        logger.info(f"Epoch {epoch}/{args.epochs} | loss={avg_loss:.4f} | val_f1={val_f1:.4f}")

        if val_f1 > best_val_f1:
            best_val_f1 = val_f1
            model.save_pretrained(output_dir)
            tokenizer.save_pretrained(output_dir)
            with open(output_dir / "metrics.json", "w") as f:
                json.dump({"epoch": epoch, "val_f1": val_f1, "report": report}, f, indent=2)
            logger.info(f"Saved best model (f1={val_f1:.4f})")

    logger.info(f"Training complete. Best val F1: {best_val_f1:.4f}")
    cm = confusion_matrix(all_labels, all_preds)
    logger.info(f"Final confusion matrix:\n{cm}")
    print(classification_report(all_labels, all_preds, target_names=["negative", "neutral", "positive"]))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Fine-tune Longformer on earnings transcripts")
    parser.add_argument("--model", default="allenai/longformer-base-4096")
    parser.add_argument("--data", required=True, help="Path to CSV with 'text' and 'label' columns")
    parser.add_argument("--output-dir", default="../models/fine_tuned")
    parser.add_argument("--epochs", type=int, default=5)
    parser.add_argument("--batch-size", type=int, default=4)
    parser.add_argument("--lr", type=float, default=2e-5)
    parser.add_argument("--max-length", type=int, default=4096)
    args = parser.parse_args()
    train(args)
