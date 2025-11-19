"""
Bitcoin Price Prediction Script
Loads the trained LSTM model and makes 5-day predictions
Shows buy/sell signals with percentage changes and visualization
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import torch
import torch.nn as nn
import pymysql
from datetime import datetime, timedelta
import pickle
import warnings
import os
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
    
    def __init__(self, model_path='best_btc_lstm_model.pth', scaler_path='scaler.pkl'):
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
        print(f"Using device: {self.device}")
        if torch.cuda.is_available():
            print(f"   GPU: {torch.cuda.get_device_name(0)}")
        
    def load_model(self):
        """Load the trained model and scaler"""
        print("\nLoading trained model...")
        try:
            # Load model checkpoint
            checkpoint = torch.load(self.model_path, map_location=self.device)
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
            
            print(f"Model loaded successfully!")
            print(f"Sequence length: {self.seq_length} days")
            print(f"Prediction steps: {self.prediction_steps} days")
            print(f"Hidden size: {hidden_size}")
            print(f"Best validation loss: {checkpoint['best_val_loss']:.6f}")
            return True
            
        except Exception as e:
            print(f"Error loading model: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def fetch_latest_data_from_db(self):
        """Fetch latest Bitcoin price data from database"""
        print("\nFetching latest Bitcoin data from database...")
        try:
            connection = pymysql.connect(**DB_CONFIG)
            cursor = connection.cursor()
            
            # Fetch latest data (need at least seq_length + 1 for yesterday's price)
            cursor.execute(f"""
                SELECT timestamp, close_price 
                FROM instrument_prices 
                WHERE instrument_id = '2376ac2b-fe9f-41ad-bb47-deb6d30d3253'
                ORDER BY timestamp DESC
                LIMIT {self.seq_length + 10}
            """)
            
            rows = cursor.fetchall()
            connection.close()
            
            if len(rows) < self.seq_length:
                print(f"Not enough data. Need at least {self.seq_length} records, got {len(rows)}")
                return False
            
            # Convert to DataFrame (reverse to chronological order)
            df = pd.DataFrame(rows[::-1])
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            df['close_price'] = df['close_price'].astype(float)  # Convert Decimal to float
            df = df.rename(columns={'close_price': 'Close', 'timestamp': 'Date'})
            df = df.set_index('Date')
            
            self.data = df[['Close']].copy()
            self.current_price = float(self.data['Close'].iloc[-1])
            self.yesterday_price = float(self.data['Close'].iloc[-2]) if len(self.data) > 1 else self.current_price
            
            print(f"Fetched {len(self.data)} latest records")
            print(f"Latest date: {df.index[-1]}")
            print(f"Current Price (Today): ${self.current_price:,.2f}")
            print(f"Yesterday's Price: ${self.yesterday_price:,.2f}")
            
            # Calculate today's change vs yesterday
            today_change = ((self.current_price - self.yesterday_price) / self.yesterday_price) * 100
            print(f"Today's Change: {today_change:+.2f}%")
            
            return True
            
        except Exception as e:
            print(f"Error fetching data: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def predict_future_prices(self):
        """Predict future prices using sliding window on GPU/CPU"""
        print(f"\nPredicting next {self.prediction_steps} days...")
        
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
        
        print("Predictions generated!")
        return predictions
    
    def calculate_percentage_changes(self, predictions):
        """Calculate percentage changes vs yesterday's price"""
        changes_vs_yesterday = []
        changes_day_to_day = []
        
        # Changes vs yesterday
        for pred in predictions:
            change = ((pred - self.yesterday_price) / self.yesterday_price) * 100
            changes_vs_yesterday.append(change)
        
        # Day-to-day changes
        prev_price = self.current_price
        for pred in predictions:
            change = ((pred - prev_price) / prev_price) * 100
            changes_day_to_day.append(change)
            prev_price = pred
        
        return changes_vs_yesterday, changes_day_to_day
    
    def display_predictions(self, predictions):
        """Display prediction results with buy/sell signals"""
        print("\n" + "="*100)
        print("BITCOIN PRICE PREDICTIONS - NEXT 5 DAYS")
        print("="*100)
        
        print(f"\nYesterday's Price: ${self.yesterday_price:,.2f}")
        print(f"Current Price (Today): ${self.current_price:,.2f}")
        
        today_vs_yesterday = ((self.current_price - self.yesterday_price) / self.yesterday_price) * 100
        today_signal = "UP" if today_vs_yesterday > 0 else "DOWN"
        print(f"Today vs Yesterday: {today_vs_yesterday:+.2f}% {today_signal}")
        
        print(f"\n{'Day':<10} {'Date':<15} {'Predicted Price':<20} {'vs Yesterday':<18} {'Day Change':<15} {'Signal':<10}")
        print("-" * 100)
        
        changes_vs_yesterday, changes_day_to_day = self.calculate_percentage_changes(predictions)
        
        # Generate future dates
        base_date = self.data.index[-1]
        for i, (pred, change_yday, change_day) in enumerate(zip(predictions, changes_vs_yesterday, changes_day_to_day)):
            future_date = base_date + timedelta(days=i+1)
            date_str = future_date.strftime('%Y-%m-%d')
            
            signal = "BUY" if change_yday > 0 else "SELL"
            sign_yday = "+" if change_yday >= 0 else ""
            sign_day = "+" if change_day >= 0 else ""
            
            print(f"Day {i+1:<6} {date_str:<15} ${pred:>12,.2f}        {sign_yday}{change_yday:>6.2f}%           "
                  f"{sign_day}{change_day:>6.2f}%          {signal}")
        
        print("="*100)
        
        # Summary and Recommendation
        avg_change = np.mean(changes_vs_yesterday)
        final_change = changes_vs_yesterday[-1]
        total_change = ((predictions[-1] - self.yesterday_price) / self.yesterday_price) * 100
        
        print(f"\nANALYSIS SUMMARY:")
        print(f"  Average Change (vs Yesterday): {avg_change:+.2f}%")
        print(f"  Day 5 Change (vs Yesterday): {final_change:+.2f}%")
        print(f"  5-Day Total Change: {total_change:+.2f}%")
        print(f"  Expected Price on Day 5: ${predictions[-1]:,.2f}")
        
        # Trend analysis
        upward_days = sum(1 for c in changes_day_to_day if c > 0)
        downward_days = sum(1 for c in changes_day_to_day if c < 0)
        
        print(f"\nTREND ANALYSIS:")
        print(f"  Upward days: {upward_days}/5")
        print(f"  Downward days: {downward_days}/5")
        
        if avg_change > 2:
            trend = "STRONG BULLISH"
            recommendation = "STRONG BUY - Good upward momentum expected"
        elif avg_change > 0:
            trend = "BULLISH"
            recommendation = "BUY - Positive trend expected"
        elif avg_change > -2:
            trend = "BEARISH"
            recommendation = "SELL - Negative trend expected"
        else:
            trend = "STRONG BEARISH"
            recommendation = "STRONG SELL - Significant downward pressure"
        
        print(f"  Overall Trend: {trend}")
        print(f"\nRECOMMENDATION: {recommendation}")
        print("="*100)
        
        return predictions, changes_vs_yesterday
    
    def plot_predictions(self, predictions):
        """Plot historical data with future predictions"""
        print("\nGenerating prediction chart...")
        
        # Prepare historical data (last 30 days)
        historical_prices = self.data['Close'].values[-30:]
        historical_dates = self.data.index[-30:]
        
        # Future dates
        base_date = self.data.index[-1]
        future_dates = [base_date + timedelta(days=i+1) for i in range(self.prediction_steps)]
        
        # Create figure with 2 subplots
        fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(14, 10))
        
        # ===== PLOT 1: Price Chart =====
        # Plot historical prices (solid blue line)
        ax1.plot(historical_dates, historical_prices, 
                'b-', linewidth=2, label='Historical Price', marker='o', markersize=4)
        
        # Connect last historical to first prediction
        connection_dates = [historical_dates[-1], future_dates[0]]
        connection_prices = [historical_prices[-1], predictions[0]]
        ax1.plot(connection_dates, connection_prices, 
                'r--', linewidth=2, alpha=0.7)
        
        # Plot predictions (dotted red line)
        ax1.plot(future_dates, predictions, 
                'r--', linewidth=2.5, label='Predicted Price (Next 5 Days)', 
                marker='s', markersize=7, alpha=0.8)
        
        # Add current price line
        ax1.axhline(y=self.current_price, color='green', linestyle=':', 
                   alpha=0.6, label=f'Current Price: ${self.current_price:,.0f}')
        
        # Add yesterday's price line
        ax1.axhline(y=self.yesterday_price, color='orange', linestyle=':', 
                   alpha=0.6, label=f"Yesterday's Price: ${self.yesterday_price:,.0f}")
        
        # Formatting
        ax1.set_xlabel('Date', fontsize=12, fontweight='bold')
        ax1.set_ylabel('BTC Price (USD)', fontsize=12, fontweight='bold')
        ax1.set_title('Bitcoin Price Prediction - LSTM Model', fontsize=14, fontweight='bold')
        ax1.legend(fontsize=10, loc='best')
        ax1.grid(True, alpha=0.3)
        ax1.tick_params(axis='x', rotation=45)
        ax1.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'${x:,.0f}'))
        
        # ===== PLOT 2: Percentage Change =====
        _, changes_vs_yesterday = self.calculate_percentage_changes(predictions)
        
        colors = ['green' if c > 0 else 'red' for c in changes_vs_yesterday]
        bars = ax2.bar(range(1, self.prediction_steps + 1), changes_vs_yesterday, 
                      color=colors, alpha=0.7, edgecolor='black', linewidth=1.5)
        
        # Add value labels on bars
        for i, (bar, val) in enumerate(zip(bars, changes_vs_yesterday)):
            height = bar.get_height()
            ax2.text(bar.get_x() + bar.get_width()/2., height,
                    f'{val:+.2f}%',
                    ha='center', va='bottom' if val > 0 else 'top',
                    fontweight='bold', fontsize=10)
        
        ax2.axhline(y=0, color='black', linestyle='-', linewidth=1, alpha=0.5)
        ax2.set_xlabel('Prediction Day', fontsize=12, fontweight='bold')
        ax2.set_ylabel('% Change vs Yesterday', fontsize=12, fontweight='bold')
        ax2.set_title('Predicted Price Change (vs Yesterday)', fontsize=14, fontweight='bold')
        ax2.set_xticks(range(1, self.prediction_steps + 1))
        ax2.set_xticklabels([f'Day {i}' for i in range(1, self.prediction_steps + 1)])
        ax2.grid(True, alpha=0.3, axis='y')
        ax2.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'{x:+.1f}%'))
        
        plt.tight_layout()
        
        # Save plot
        plt.savefig('btc_prediction.png', dpi=150, bbox_inches='tight')
        print("Chart saved as 'btc_prediction.png'")
        plt.show()
    
    def run(self):
        """Main execution flow"""
        print("\n" + "="*100)
        print("BITCOIN PRICE PREDICTOR - PREDICTION MODE")
        print("="*100)
        
        # Load trained model
        if not self.load_model():
            return
        
        # Fetch latest data
        if not self.fetch_latest_data_from_db():
            return
        
        # Make predictions
        predictions = self.predict_future_prices()
        
        # Display results
        self.display_predictions(predictions)
        
        # Plot results
        self.plot_predictions(predictions)
        
        print("\nPrediction complete!")


if __name__ == "__main__":
    predictor = BTCPricePredictor(
        model_path='best_btc_lstm_model.pth',
        scaler_path='scaler.pkl'
    )
    
    try:
        predictor.run()
    except KeyboardInterrupt:
        print("\nPrediction stopped by user")
    except Exception as e:
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()
