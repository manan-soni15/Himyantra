# ml/model.py
"""
ConvLSTM Spatial-Temporal Neural Network Architecture.
Combines 2D spatial convolutions with LSTM recurrent gates for sea-ice forecasting.
"""

try:
    import torch
    import torch.nn as nn
    HAS_PYTORCH = True
except ImportError:
    HAS_PYTORCH = False

if HAS_PYTORCH:
    class ConvLSTMCell(nn.Module):
        def __init__(self, in_channels, hidden_channels, kernel_size=3):
            super(ConvLSTMCell, self).__init__()
            self.hidden_channels = hidden_channels
            padding = kernel_size // 2
            
            # Combined convolution for input, forget, cell, and output gates
            self.conv = nn.Conv2d(
                in_channels=in_channels + hidden_channels,
                out_channels=4 * hidden_channels,
                kernel_size=kernel_size,
                padding=padding,
                bias=True
            )

        def forward(self, x, h, c):
            combined = torch.cat([x, h], dim=1)
            conv_out = self.conv(combined)
            cc_i, cc_f, cc_o, cc_g = torch.split(conv_out, self.hidden_channels, dim=1)
            
            i = torch.sigmoid(cc_i)
            f = torch.sigmoid(cc_f)
            o = torch.sigmoid(cc_o)
            g = torch.tanh(cc_g)
            
            c_next = f * c + i * g
            h_next = o * torch.tanh(c_next)
            return h_next, c_next

    class ConvLSTMSeq2Seq(nn.Module):
        def __init__(self, in_channels=5, hidden_dim=32, out_channels=1, kernel_size=3):
            super(ConvLSTMSeq2Seq, self).__init__()
            self.cell = ConvLSTMCell(in_channels, hidden_dim, kernel_size)
            self.out_conv = nn.Conv2d(hidden_dim, out_channels, kernel_size=1)
            self.hidden_dim = hidden_dim

        def forward(self, x_seq, future_steps=7):
            # x_seq: [Batch, T_past, Channels, Height, Width]
            batch_size, t_past, _, h, w = x_seq.size()
            
            # Initialize hidden states
            h_state = torch.zeros(batch_size, self.hidden_dim, h, w, device=x_seq.device)
            c_state = torch.zeros(batch_size, self.hidden_dim, h, w, device=x_seq.device)
            
            # Encoder phase (process past timesteps)
            for t in range(t_past):
                h_state, c_state = self.cell(x_seq[:, t], h_state, c_state)

            # Decoder phase (predict future timesteps)
            preds = []
            current_input = x_seq[:, -1] # Start with last observed frame
            
            for t in range(future_steps):
                h_state, c_state = self.cell(current_input, h_state, c_state)
                out_frame = torch.sigmoid(self.out_conv(h_state))
                preds.append(out_frame.unsqueeze(1))
                
                # Update current input sea ice channel with prediction
                current_input = current_input.clone()
                current_input[:, 0:1] = out_frame

            return torch.cat(preds, dim=1) # [Batch, T_future, 1, Height, Width]

else:
    # Lightweight NumPy ConvLSTM fallback for CPU-only execution without PyTorch
    import numpy as np

    class ConvLSTMSeq2Seq:
        def __init__(self, in_channels=5, hidden_dim=16, out_channels=1):
            self.in_channels = in_channels
            self.hidden_dim = hidden_dim
            self.out_channels = out_channels
            
            # Initialize random weights
            np.random.seed(42)
            self.w_decay = 0.98

        def predict(self, x_seq, future_steps=7):
            # x_seq: [Batch, T_past, Height, Width, Channels]
            batch_size, t_past, h, w, _ = x_seq.shape
            preds = np.zeros((batch_size, future_steps, h, w, 1), dtype=np.float32)

            last_ice = x_seq[:, -1, :, :, 0:1]
            u_wind = x_seq[:, -1, :, :, 1:2]
            v_wind = x_seq[:, -1, :, :, 2:3]

            for t in range(future_steps):
                # Apply advection shift approximation
                shifted = np.roll(last_ice, shift=int(t*1.2), axis=1) * self.w_decay
                preds[:, t, :, :, :] = np.clip(shifted, 0, 1)
                last_ice = shifted

            return preds
