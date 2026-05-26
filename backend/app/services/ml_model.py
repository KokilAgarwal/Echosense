import logging
import numpy as np
import torch
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
import os

from app.model import LSTMAutoencoder

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class HybridAnomalyService:
    def __init__(self, model_filename="echosense_model.pth", window_size=5, alpha=0.5, beta=0.3, gamma=0.2):
        self.window_size = window_size
        self.alpha = alpha
        self.beta = beta
        self.gamma = gamma
        self.model = LSTMAutoencoder(n_features=3, hidden_size=64)
        
        # Dynamically resolve path to echosense_model.pth
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        model_path = os.path.join(base_dir, model_filename)
        
        if not os.path.exists(model_path):
            # Fallback for current working directory assumption
            model_path = os.path.join(os.getcwd(), model_filename)

        try:
            self.model.load_state_dict(torch.load(model_path, map_location=torch.device('cpu')))
            logger.info(f"Loaded Hybrid Fusion Model from {model_path}")
        except Exception as e:
            logger.error(f"Could not load model: {e}")
        self.model.eval()
        self.scaler = MinMaxScaler()

    def process(self, ndvi_values, alpha=None, beta=None, gamma=None):
        if len(ndvi_values) <= self.window_size:
            return self._empty_result(ndvi_values)

        # Allow overriding weights
        alpha = alpha if alpha is not None else self.alpha
        beta = beta if beta is not None else self.beta
        gamma = gamma if gamma is not None else self.gamma

        df = pd.DataFrame(ndvi_values, columns=["ndvi"])
        df['slope'] = df['ndvi'].diff()
        df['rolling_mean'] = df['ndvi'].rolling(window=3).mean()
        df = df.bfill()

        features = df[['ndvi', 'slope', 'rolling_mean']]
        self.scaler.fit(features)
        scaled = self.scaler.transform(features)

        # Create sequences
        sequences = []
        for i in range(len(scaled) - self.window_size):
            sequences.append(scaled[i:i+self.window_size])

        if not sequences:
            return self._empty_result(ndvi_values)

        X_tensor = torch.tensor(np.array(sequences), dtype=torch.float32)
        with torch.no_grad():
            reconstructed = self.model(X_tensor).numpy()

        # 1. LSTM reconstruction error
        errors = np.mean((sequences - reconstructed)**2, axis=(1, 2))

        # 2. Statistical Z-score deviation
        mean_error = np.mean(errors)
        std_error = np.std(errors)
        if std_error == 0:
            std_error = 1e-8
        z_score = (errors - mean_error) / std_error

        # 3. Seasonal deviation (rolling NDVI baseline)
        seasonal_dev_seq = np.abs(df['ndvi'].values[self.window_size:] - df['rolling_mean'].values[self.window_size:])

        # Fusion
        fusion_score = alpha * errors + beta * z_score + gamma * seasonal_dev_seq

        # Normalize fusion score [0, 100] scale
        f_min = np.min(fusion_score)
        f_max = np.max(fusion_score)
        if f_max - f_min == 0:
            f_max += 1e-8
        silence_score = (fusion_score - f_min) / (f_max - f_min) * 100

        # Anomaly Detection (Threshold)
        m_silence = np.mean(silence_score)
        std_silence = np.std(silence_score)
        threshold = m_silence + 1.5 * std_silence
        anomalies = silence_score > threshold

        # Expected NDVI based on inverse transform of last time steps
        expected_features = self.scaler.inverse_transform(reconstructed[:, -1, :])
        expected_ndvi = expected_features[:, 0]

        # Status Logic
        statuses = []
        for score in silence_score:
            if score < 30:
                statuses.append("Healthy")
            elif score <= 70:
                statuses.append("Stress")
            else:
                statuses.append("Critical")

        # Padding for warm-up period
        pad_size = self.window_size
        final_expected = ndvi_values[:pad_size] + expected_ndvi.tolist()
        final_silence_score = [0.0] * pad_size + silence_score.tolist()
        final_statuses = ["Healthy"] * pad_size + statuses
        final_anomalies = [False] * pad_size + anomalies.tolist()

        # Generate Metrics
        metrics = {
            "mse": float(mean_error),
            "rmse": float(np.sqrt(mean_error)),
            "mean_error": float(mean_error),
            "std_error": float(std_error),
            "anomaly_ratio": float(np.sum(anomalies) / len(anomalies))
        }

        return {
            "actual_ndvi": ndvi_values,
            "expected_ndvi": final_expected,
            "silence_score": final_silence_score,
            "anomaly_status": final_statuses,
            "is_anomaly": final_anomalies,
            "metrics": metrics,
            "threshold": float(threshold)
        }

    def _empty_result(self, ndvi_values):
        length = len(ndvi_values)
        return {
            "actual_ndvi": ndvi_values,
            "expected_ndvi": ndvi_values,
            "silence_score": [0.0] * length,
            "anomaly_status": ["Healthy"] * length,
            "is_anomaly": [False] * length,
            "metrics": {
                "mse": 0.0,
                "rmse": 0.0,
                "mean_error": 0.0,
                "std_error": 0.0,
                "anomaly_ratio": 0.0
            },
            "threshold": 0.0
        }

# Global singleton service
hybrid_service = HybridAnomalyService()
