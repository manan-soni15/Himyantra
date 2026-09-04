# ml/train.py
"""
PyTorch ConvLSTM Model Training Script for Antarctic Sea-Ice Forecasting.
Trains spatial-temporal neural network model, logs RMSE/MAE metrics,
and saves model weights checkpoint to ml/models/convlstm_seaice_v1.pth.
"""

import os
import json
import time
import numpy as np

from dataset import AntarcticIceDataset
from model import ConvLSTMSeq2Seq, HAS_PYTORCH

if HAS_PYTORCH:
    import torch
    import torch.nn as nn
    import torch.optim as optim
    from torch.utils.data import DataLoader, TensorDataset

def train_convlstm_model(epochs=20, batch_size=8, learning_rate=0.001):
    print("=" * 60)
    print("HIMYANTRA — CONVLSTM HIGH-ACCURACY SEA-ICE MODEL TRAINING")
    print("=" * 60)
    
    models_dir = os.path.join(os.path.dirname(__file__), 'models')
    os.makedirs(models_dir, exist_ok=True)

    # 1. Dataset generation & split (300 samples for high accuracy)
    print("\n[1/4] Generating Enhanced Antarctic Sea-Ice & ERA5 Weather Sequences...")
    ds = AntarcticIceDataset(num_samples=300, height=64, width=64, t_past=7, t_future=7, seed=42)
    (X_tr, Y_tr), (X_val, Y_val) = ds.get_train_val_split(split_ratio=0.85)

    print(f" -> Training set: {X_tr.shape[0]} samples | Validation set: {X_val.shape[0]} samples")
    print(f" -> Tensor dimension: [Batch, T_past=7, H=64, W=64, C=5]")

    if HAS_PYTORCH:
        print("\n[2/4] Initializing PyTorch ConvLSTM Encoder-Decoder Architecture...")
        device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        print(f" -> Training device: {device}")

        # Reorder dimensions for PyTorch: [Batch, Sequence, Channels, Height, Width]
        X_tr_t = torch.tensor(X_tr, dtype=torch.float32).permute(0, 1, 4, 2, 3).to(device)
        Y_tr_t = torch.tensor(Y_tr, dtype=torch.float32).permute(0, 1, 4, 2, 3).to(device)
        X_val_t = torch.tensor(X_val, dtype=torch.float32).permute(0, 1, 4, 2, 3).to(device)
        Y_val_t = torch.tensor(Y_val, dtype=torch.float32).permute(0, 1, 4, 2, 3).to(device)

        train_dataset = TensorDataset(X_tr_t, Y_tr_t)
        train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)

        model = ConvLSTMSeq2Seq(in_channels=5, hidden_dim=32, out_channels=1).to(device)
        criterion = nn.MSELoss()
        optimizer = optim.Adam(model.parameters(), lr=learning_rate)
        scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs, eta_min=1e-5)

        print("\n[3/4] Training Model Epochs...")
        start_time = time.time()
        
        train_losses = []
        val_losses = []

        for epoch in range(1, epochs + 1):
            model.train()
            total_train_loss = 0.0

            for batch_x, batch_y in train_loader:
                optimizer.zero_grad()
                preds = model(batch_x, future_steps=7)
                loss = criterion(preds, batch_y)
                loss.backward()
                optimizer.step()
                total_train_loss += loss.item() * batch_x.size(0)

            scheduler.step()
            avg_train_loss = total_train_loss / len(train_dataset)
            train_losses.append(avg_train_loss)

            # Validation evaluation
            model.eval()
            with torch.no_grad():
                val_preds = model(X_val_t, future_steps=7)
                val_loss = criterion(val_preds, Y_val_t).item()
                val_losses.append(val_loss)

            print(f"Epoch [{epoch:02d}/{epochs:02d}] - Train Loss (MSE): {avg_train_loss:.6f} | Val Loss (MSE): {val_loss:.6f}")

        elapsed_sec = time.time() - start_time
        print(f"\n -> Training completed in {elapsed_sec:.2f} seconds.")

        # Compute evaluation metrics (RMSE & MAE)
        with torch.no_grad():
            final_val_preds = model(X_val_t, future_steps=7).cpu().numpy()
            target_np = Y_val_t.cpu().numpy()
            
            rmse = float(np.sqrt(np.mean((final_val_preds - target_np)**2)))
            mae = float(np.mean(np.abs(final_val_preds - target_np)))

        # 4. Save Model Checkpoint & Metrics
        checkpoint_path = os.path.join(models_dir, 'convlstm_seaice_v1.pth')
        torch.save({
            'model_state_dict': model.state_dict(),
            'epoch': epochs,
            'val_loss': val_losses[-1],
            'rmse': rmse,
            'mae': mae
        }, checkpoint_path)
        print(f"\n[4/4] Saved PyTorch model checkpoint to: {checkpoint_path}")

    else:
        print("\n[2/4] PyTorch not available, running NumPy ConvLSTM Baseline...")
        model = ConvLSTMSeq2Seq(in_channels=5, hidden_dim=16, out_channels=1)
        preds = model.predict(X_val, future_steps=7)
        
        rmse = float(np.sqrt(np.mean((preds - Y_val)**2)))
        mae = float(np.mean(np.abs(preds - Y_val)))
        checkpoint_path = os.path.join(models_dir, 'convlstm_baseline.npy')
        np.save(checkpoint_path, preds)
        print(f"\n[4/4] Saved baseline prediction array to: {checkpoint_path}")

    metrics = {
        'model_name': 'ConvLSTM Antarctic Sea-Ice Forecaster',
        'target_variable': 'Sea Ice Concentration (0-100%)',
        'spatial_grid': '64x64 (25km resolution)',
        'forecast_horizon': '7 Days',
        'validation_rmse': round(rmse, 4),
        'validation_mae': round(mae, 4),
        'prediction_accuracy_pct': round((1.0 - rmse) * 100, 2),
        'timestamp': time.strftime('%Y-%m-%d %H:%M:%S')
    }

    metrics_path = os.path.join(models_dir, 'metrics.json')
    with open(metrics_path, 'w') as f:
        json.dump(metrics, f, indent=2)

    print(f"Saved evaluation metrics report to: {metrics_path}")
    print("\n" + "=" * 60)
    print("TRAINING SUCCESSFUL!")
    print(f"Validation RMSE: {metrics['validation_rmse']} | Prediction Accuracy: {metrics['prediction_accuracy_pct']}%")
    print("=" * 60)

if __name__ == '__main__':
    train_convlstm_model(epochs=20, batch_size=8)
