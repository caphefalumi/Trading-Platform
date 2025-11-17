"""
Bitcoin Price Prediction API Script
Loads the trained LSTM model and makes predictions
Returns JSON output for API consumption
"""

import numpy as np
import pandas as pd
import torch
import torch.nn as nn
import pymysql
from datetime import datetime, timedelta
import pickle
import warnings
import os
import sys
import json
from dotenv import load_dotenv

warnings.filterwarnings('ignore')

# Load environment variables from .env file
load_dotenv('../../server/.env')

# Database configuration from .env
DB_CONFIG = {
    'charset': os.getenv('DB_CHARSET', 'utf8mb4'),
    'connect_timeout': int(os.getenv('DB_CONNECT_TIMEOUT', '10')),
    'cursorclass': pymysql.cursors.DictCursor,
    'db': os.getenv('DB_NAME'),
    'host': os.getenv('DB_HOST'),
    'password': os.getenv('DB_PASSWORD'),
    'read_timeout': int(os.getenv('DB_READ_TIMEOUT', '10')),
    'port': int(os.getenv('DB_PORT', '3306')),
    'user': os.getenv('DB_USER'),
    'write_timeout': int(os.getenv('DB_WRITE_TIMEOUT', '10')),
}

# Add SSL if connecting to cloud database (Aiven)
if 'aivencloud.com' in DB_CONFIG.get('host', ''):
    DB_CONFIG['ssl'] = {'ssl': True}


class LSTMModel(nn.Module):
    """LSTM Model for Bitcoin Price Prediction"""
    def __init__(self, input_size=1, hidden_layer_size=64, output_size=1):
        super(LSTMModel, self).__init__()
        self.hidden_layer_size = hidden_layer_size
        self.lstm = nn.LSTM(input_size, hidden_layer_size)
        self.linear = nn.Linear(hidden_layer_size, output_size)
        self.hidden_cell = (torch.zeros(1, 1, self.hidden_layer_size),
                            torch.zeros(1, 1, self.hidden_layer_size))

    def forward(self, input_seq):
        lstm_out, self.hidden_cell = self.lstm(input_seq.view(len(input_seq), 1, -1), self.hidden_cell)
        predictions = self.linear(lstm_out.view(len(input_seq), -1))
        return predictions[-1]


class BTCPricePredictor:
    """Bitcoin Price Predictor using trained LSTM model"""
    
    def __init__(self, model_path='../../best_btc_lstm_model.pth', scaler_path='../../scaler.pkl'):
        self.model_path = model_path
        self.scaler_path = scaler_path
        self.model = None
        self.scaler = None
        self.data = None
        self.current_price = None
        self.yesterday_price = None
        self.seq_length = None
        self.prediction_steps = None
        
        # Setup device (GPU if available, otherwise CPU)
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        
    def load_model(self):
        """Load the trained model and scaler"""
        try:
            # Load model checkpoint
            checkpoint = torch.load(self.model_path, map_location=self.device, weights_only=False)
            self.seq_length = checkpoint['seq_length']
            self.prediction_steps = checkpoint['prediction_steps']
            hidden_size = checkpoint['hidden_size']
            
            # Initialize and load model, move to device
            self.model = LSTMModel(hidden_layer_size=hidden_size).to(self.device)
            self.model.load_state_dict(checkpoint['model_state_dict'])
            self.model.eval()
            
            # Load scaler
            with open(self.scaler_path, 'rb') as f:
                self.scaler = pickle.load(f)
            
            return True
            
        except Exception as e:
            raise Exception(f"Error loading model: {e}")
    
    def fetch_latest_data_from_db(self):
        """Fetch latest Bitcoin price data from database"""
        try:
            connection = pymysql.connect(**DB_CONFIG)
            cursor = connection.cursor()
            
            # Fetch latest data (need at least seq_length + 1 for yesterday's price)
            cursor.execute(f"""
                SELECT timestamp, close_price 
                FROM instrument_prices 
                WHERE instrument_id = '730ecbc1-c10d-11f0-930e-a68413f72443'
                ORDER BY timestamp DESC
                LIMIT {self.seq_length + 10}
            """)
            
            rows = cursor.fetchall()
            connection.close()
            
            if len(rows) < self.seq_length:
                raise Exception(f"Not enough data. Need at least {self.seq_length} records, got {len(rows)}")
            
            # Convert to DataFrame (reverse to chronological order)
            df = pd.DataFrame(rows[::-1])
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            df['close_price'] = df['close_price'].astype(float)  # Convert Decimal to float
            df = df.rename(columns={'close_price': 'Close', 'timestamp': 'Date'})
            df = df.set_index('Date')
            
            self.data = df[['Close']].copy()
            self.current_price = float(self.data['Close'].iloc[-1])
            self.yesterday_price = float(self.data['Close'].iloc[-2]) if len(self.data) > 1 else self.current_price
            
            return True
            
        except Exception as e:
            raise Exception(f"Error fetching data: {e}")
    
    def predict_future_prices(self):
        """Predict future prices using sliding window on GPU/CPU"""
        # Get last sequence
        last_sequence = self.data['Close'].values[-self.seq_length:]
        last_sequence_norm = self.scaler.transform(last_sequence.reshape(-1, 1)).flatten()
        
        # Multi-step prediction
        predictions_norm = []
        temp_seq = last_sequence_norm.copy()
        
        with torch.no_grad():
            for step in range(self.prediction_steps):
                # Move hidden states to device
                self.model.hidden_cell = (
                    torch.zeros(1, 1, self.model.hidden_layer_size).to(self.device),
                    torch.zeros(1, 1, self.model.hidden_layer_size).to(self.device)
                )
                
                # Move data to device
                seq_tensor = torch.FloatTensor(temp_seq).to(self.device)
                y_pred = self.model(seq_tensor)
                pred_value = y_pred.cpu().item()  # Move back to CPU for numpy operations
                predictions_norm.append(pred_value)
                
                # Slide window
                temp_seq = np.append(temp_seq[1:], pred_value)
        
        # Inverse transform to actual prices
        predictions = self.scaler.inverse_transform(
            np.array(predictions_norm).reshape(-1, 1)
        ).flatten()
        
        return predictions
    
    def calculate_signals(self, predictions):
        """Calculate trading signals and metrics"""
        base_date = self.data.index[-1]
        
        predictions_data = []
        prev_price = self.current_price
        
        for i, pred_price in enumerate(predictions):
            future_date = base_date + timedelta(days=i+1)
            
            # Calculate changes
            change_vs_yesterday = ((pred_price - self.yesterday_price) / self.yesterday_price) * 100
            change_vs_current = ((pred_price - self.current_price) / self.current_price) * 100
            change_day_to_day = ((pred_price - prev_price) / prev_price) * 100
            
            # Determine signal
            signal = "BUY" if change_vs_yesterday > 0 else "SELL"
            confidence = min(abs(change_vs_yesterday) / 2, 100)  # Simple confidence metric
            
            predictions_data.append({
                'day': i + 1,
                'date': future_date.strftime('%Y-%m-%d'),
                'predictedPrice': float(pred_price),
                'changeVsYesterday': float(change_vs_yesterday),
                'changeVsCurrent': float(change_vs_current),
                'changeDayToDay': float(change_day_to_day),
                'signal': signal,
                'confidence': float(confidence)
            })
            
            prev_price = pred_price
        
        return predictions_data
    
    def get_trend_analysis(self, predictions):
        """Analyze overall trend and provide recommendation"""
        changes_vs_yesterday = [
            ((pred - self.yesterday_price) / self.yesterday_price) * 100 
            for pred in predictions
        ]
        
        avg_change = np.mean(changes_vs_yesterday)
        final_change = changes_vs_yesterday[-1]
        total_change = ((predictions[-1] - self.yesterday_price) / self.yesterday_price) * 100
        
        upward_days = sum(1 for i in range(1, len(predictions)) 
                         if predictions[i] > predictions[i-1])
        downward_days = len(predictions) - 1 - upward_days
        
        # Determine trend
        if avg_change > 2:
            trend = "STRONG_BULLISH"
            recommendation = "STRONG_BUY"
            description = "Strong upward momentum expected"
        elif avg_change > 0:
            trend = "BULLISH"
            recommendation = "BUY"
            description = "Positive trend expected"
        elif avg_change > -2:
            trend = "BEARISH"
            recommendation = "SELL"
            description = "Negative trend expected"
        else:
            trend = "STRONG_BEARISH"
            recommendation = "STRONG_SELL"
            description = "Significant downward pressure"
        
        return {
            'trend': trend,
            'recommendation': recommendation,
            'description': description,
            'averageChange': float(avg_change),
            'finalDayChange': float(final_change),
            'totalChange': float(total_change),
            'upwardDays': upward_days,
            'downwardDays': downward_days,
            'expectedFinalPrice': float(predictions[-1])
        }
    
    def run(self):
        """Main execution flow - returns JSON data"""
        # Load trained model
        self.load_model()
        
        # Fetch latest data
        self.fetch_latest_data_from_db()
        
        # Make predictions
        predictions = self.predict_future_prices()
        
        # Calculate signals
        predictions_data = self.calculate_signals(predictions)
        
        # Get trend analysis
        trend_analysis = self.get_trend_analysis(predictions)
        
        # Current price info
        today_change = ((self.current_price - self.yesterday_price) / self.yesterday_price) * 100
        
        # Build response
        result = {
            'success': True,
            'timestamp': datetime.now().isoformat(),
            'currentPrice': float(self.current_price),
            'yesterdayPrice': float(self.yesterday_price),
            'todayChange': float(today_change),
            'latestDataDate': self.data.index[-1].strftime('%Y-%m-%d'),
            'modelInfo': {
                'sequenceLength': self.seq_length,
                'predictionSteps': self.prediction_steps,
                'device': str(self.device)
            },
            'predictions': predictions_data,
            'analysis': trend_analysis
        }
        
        return result


def main():
    """Main function for API calls"""
    try:
        # Get script directory
        script_dir = os.path.dirname(os.path.abspath(__file__))
        os.chdir(script_dir)
        
        # Create predictor
        predictor = BTCPricePredictor()
        
        # Run prediction
        result = predictor.run()
        
        # Output JSON to stdout
        print(json.dumps(result, indent=2))
        
        return 0
        
    except Exception as e:
        error_result = {
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }
        print(json.dumps(error_result, indent=2))
        return 1


if __name__ == "__main__":
    sys.exit(main())
