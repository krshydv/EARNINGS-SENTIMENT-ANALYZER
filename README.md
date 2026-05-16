# Earnings Call Sentiment Analyzer

A production-grade NLP system that scores sentiment from earnings call transcripts using a fine-tuned Longformer model and backtests whether sentiment predicts post-earnings price moves.

![Python](https://img.shields.io/badge/Python-3.10+-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110-green)
![React](https://img.shields.io/badge/React-18-blue)
![HuggingFace](https://img.shields.io/badge/HuggingFace-Transformers-yellow)
![License](https://img.shields.io/badge/License-MIT-lightgrey)

## Overview

This project fine-tunes `allenai/longformer-base-4096` on labeled earnings call transcripts, exposes a FastAPI inference server, and provides a React dashboard for real-time analysis and event-study backtesting.

```
Input: Earnings call transcript text
  └─> Longformer tokenizer (max 4096 tokens)
      └─> Fine-tuned classifier head
          └─> Sentiment class + confidence + key phrases
              └─> Event-study backtest vs yfinance price data
```

## Features

- Fine-tune Longformer on custom earnings transcript dataset
- REST API with FastAPI for real-time inference
- Sentiment scoring: Positive / Neutral / Negative
- Key phrase extraction with attention visualization
- Event-study backtester using yfinance price data
- React + TypeScript dashboard with charts
- Docker Compose for one-command deployment
- Full test suite with pytest

## Project Structure

```
earnings-sentiment-analyzer/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI route handlers
│   │   ├── core/         # Config, logging, security
│   │   ├── models/       # Pydantic schemas
│   │   ├── services/     # NLP, backtest, price data
│   │   └── utils/        # Helpers
│   └── tests/
├── frontend/
│   └── src/
│       ├── components/
│       ├── hooks/
│       ├── services/
│       └── store/
├── notebooks/            # Training & EDA notebooks
├── data/                 # Raw and processed datasets
├── scripts/              # Training, eval, data prep
└── docs/
```

## Quickstart

### With Docker

```bash
git clone https://github.com/yourusername/earnings-sentiment-analyzer
cd earnings-sentiment-analyzer
cp .env.example .env
docker-compose up --build
```

App: http://localhost:5173  
API docs: http://localhost:8000/docs

### Manual Setup

```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm install && npm run dev
```

### Train the Model

```bash
cd scripts
python train.py --model allenai/longformer-base-4096 \
                --data ../data/processed/transcripts.csv \
                --epochs 5 --batch-size 4 --lr 2e-5
```

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/analyze` | Analyze a transcript |
| POST | `/api/v1/backtest` | Run event-study backtest |
| GET | `/api/v1/health` | Health check |
| GET | `/api/v1/model/info` | Model metadata |

## Model Performance

| Class | Precision | Recall | F1 | Support |
|-------|-----------|--------|----|---------|
| Negative | 0.43 | 0.46 | 0.45 | 218 |
| Neutral | 1.00 | 0.00 | 0.00 | 89 |
| Positive | 0.46 | 0.59 | 0.51 | 293 |
| **Weighted Avg** | **0.53** | **0.45** | **0.41** | **600** |

## Tech Stack

| Layer | Technology |
|-------|------------|
| ML Model | HuggingFace Transformers, PyTorch |
| Backend | FastAPI, Pydantic, SQLAlchemy |
| Frontend | React 18, TypeScript, Recharts, Zustand |
| Price Data | yfinance |
| Database | PostgreSQL (prod), SQLite (dev) |
| Containerization | Docker, Docker Compose |
| Testing | pytest, pytest-asyncio |

## License

MIT
