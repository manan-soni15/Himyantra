# Himyantra — PyTorch ConvLSTM Model Training Guide

This directory contains the machine learning pipeline to train a **Spatial-Temporal ConvLSTM Neural Network** for Antarctic sea-ice concentration forecasting.

---

## 📂 Architecture & Files

```
ml/
├── dataset.py     → Synthetic & NetCDF sequence tensor generator [Batch, T=7, H=64, W=64, C=5]
├── model.py       → PyTorch ConvLSTM Encoder-Decoder architecture (ConvLSTMCell & ConvLSTMSeq2Seq)
├── train.py       → Training script (Adam optimizer, MSE loss, checkpoint & metrics logging)
├── evaluate.py    → Validation evaluation and team leader report generator
└── models/        → Output folder for trained weights (convlstm_seaice_v1.pth) and metrics.json
```

---

## ⚡ Quick Start Instructions

### 1. Train the Model
Run the PyTorch training script from the project root:

```bash
python ml/train.py
```

This will:
- Generate spatial-temporal sea-ice and ERA5 environmental forcing sequence tensors.
- Initialize the 2D ConvLSTM Encoder-Decoder neural network.
- Train over epochs and save the model weights checkpoint to `ml/models/convlstm_seaice_v1.pth`.
- Generate an evaluation summary in `ml/models/metrics.json`.

### 2. Evaluate Model Performance
To generate a summary report for your team leader:

```bash
python ml/evaluate.py
```

---

## 📊 Dataset Tensor Structure

- **Input Tensor ($X$)**: Shape `[Batch, 7, 64, 64, 5]`
  - Channel 0: Sea-Ice Concentration ($0.0\text{--}1.0$)
  - Channel 1: Wind $U$ Vector ($\text{m/s}$)
  - Channel 2: Wind $V$ Vector ($\text{m/s}$)
  - Channel 3: Air Temperature ($^\circ\text{C}$)
  - Channel 4: MSL Pressure ($\text{hPa}$)
- **Target Tensor ($Y$)**: Shape `[Batch, 7, 64, 64, 1]` (Predicted 7-day sea-ice concentration matrix).
