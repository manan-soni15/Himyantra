# ml/dataset.py
"""
Antarctic Sea-Ice & Environmental Feature Dataset Generator.
Constructs spatial-temporal sequence tensors for ConvLSTM training.
Input Shape:  [Batch, T_past=7, Height=64, Width=64, Channels=5]
Target Shape: [Batch, T_future=7, Height=64, Width=64, Channels=1]
"""

import numpy as np

class AntarcticIceDataset:
    def __init__(self, num_samples=120, height=64, width=64, t_past=7, t_future=7, seed=42):
        np.random.seed(seed)
        self.num_samples = num_samples
        self.height = height
        self.width = width
        self.t_past = t_past
        self.t_future = t_future
        self.channels = 5 # 0: Sea Ice, 1: Wind U, 2: Wind V, 3: Temp, 4: Pressure

        self.X, self.Y = self._generate_synthetic_antarctic_sequences()

    def _generate_synthetic_antarctic_sequences(self):
        """Generates realistic spatial-temporal Antarctic sea-ice and ERA5/GFS weather sequences with polar turbulence."""
        X_data = np.zeros((self.num_samples, self.t_past, self.height, self.width, self.channels), dtype=np.float32)
        Y_data = np.zeros((self.num_samples, self.t_future, self.height, self.width, 1), dtype=np.float32)

        # Coordinate grid (-1 to 1)
        x = np.linspace(-1, 1, self.width)
        y = np.linspace(-1, 1, self.height)
        xx, yy = np.meshgrid(x, y)
        dist_from_center = np.sqrt(xx**2 + yy**2)

        for i in range(self.num_samples):
            # Base ice shelf pattern
            base_ice = np.clip(1.0 - dist_from_center * 1.2 + np.random.normal(0, 0.08, (self.height, self.width)), 0, 1)
            
            # Drift direction vectors (Wind U & V) with rotational vorticity
            u_wind = np.random.uniform(-0.4, 0.4)
            v_wind = np.random.uniform(-0.4, 0.4)
            vorticity = np.random.uniform(-0.15, 0.15)

            # Generate past 7 days
            for t in range(self.t_past):
                turbulent_x = u_wind * (t * 0.06) + vorticity * np.sin(yy * np.pi) * 0.08
                turbulent_y = v_wind * (t * 0.06) - vorticity * np.cos(xx * np.pi) * 0.08
                dist_shifted = np.sqrt((xx - turbulent_x)**2 + (yy - turbulent_y)**2)
                
                # Satellite noise & thermal melt fluctuation
                thermal_noise = np.random.normal(0, 0.12, (self.height, self.width))
                ice_t = np.clip(1.0 - dist_shifted * 1.2 + thermal_noise, 0, 1)

                X_data[i, t, :, :, 0] = ice_t # Sea Ice Concentration (0-1)
                X_data[i, t, :, :, 1] = u_wind + np.random.normal(0, 0.05, (self.height, self.width)) # Wind U
                X_data[i, t, :, :, 2] = v_wind + np.random.normal(0, 0.05, (self.height, self.width)) # Wind V
                X_data[i, t, :, :, 3] = -0.5 + (t * 0.01) + np.random.normal(0, 0.03, (self.height, self.width)) # Air Temp
                X_data[i, t, :, :, 4] = 0.98 + np.random.normal(0, 0.02, (self.height, self.width)) # Pressure

            # Generate target future 7 days (Sea Ice ground truth with non-linear storm drift)
            for t in range(self.t_future):
                total_t = self.t_past + t
                turbulent_x = u_wind * (total_t * 0.06) + vorticity * np.sin(yy * np.pi) * 0.10
                turbulent_y = v_wind * (total_t * 0.06) - vorticity * np.cos(xx * np.pi) * 0.10
                dist_shifted = np.sqrt((xx - turbulent_x)**2 + (yy - turbulent_y)**2)
                
                # Realistic polar storm fracture noise
                fracture_noise = np.random.normal(0, 0.14, (self.height, self.width))
                ice_future = np.clip(1.0 - dist_shifted * 1.2 + fracture_noise, 0, 1)
                Y_data[i, t, :, :, 0] = ice_future

        return X_data, Y_data

    def get_train_val_split(self, split_ratio=0.8):
        split_idx = int(self.num_samples * split_ratio)
        X_train, Y_train = self.X[:split_idx], self.Y[:split_idx]
        X_val, Y_val = self.X[split_idx:], self.Y[split_idx:]
        return (X_train, Y_train), (X_val, Y_val)

if __name__ == '__main__':
    ds = AntarcticIceDataset(num_samples=20)
    (X_tr, Y_tr), (X_val, Y_val) = ds.get_train_val_split()
    print(f"Dataset generated successfully!")
    print(f"X_train shape: {X_tr.shape} | Y_train shape: {Y_tr.shape}")
    print(f"X_val shape:   {X_val.shape} | Y_val shape:   {Y_val.shape}")
