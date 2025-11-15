"""
BTC Trading Bot with LSTM Price Prediction
Based on vocer.ipynb multi-step prediction model
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import torch
import torch.nn as nn
import torch.optim as optim
import yfinance as yf
from datetime import datetime, timedelta
from sklearn.preprocessing import MinMaxScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error
import warnings

warnings.filterwarnings('ignore')


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


class BTCTradingBot:
    """Bitcoin Trading Bot with LSTM Predictions"""
    
    def __init__(self, seq_length=10, prediction_steps=5, hidden_size=64):
        self.seq_length = seq_length
        self.prediction_steps = prediction_steps
        self.hidden_size = hidden_size
        self.scaler = MinMaxScaler(feature_range=(0, 1))
        self.model = None
        self.data = None
        self.current_price = None
        
    def fetch_btc_data(self, period="1y"):
        """Fetch Bitcoin price data from Yahoo Finance"""
        print("📊 Fetching Bitcoin data...")
        try:
            btc = yf.Ticker("BTC-USD")
            data = btc.history(period=period)
            self.data = data[['Close']].copy()
            self.current_price = self.data['Close'].iloc[-1]
            print(f"✓ Fetched {len(self.data)} days of BTC data")
            print(f"📈 Current BTC Price: ${self.current_price:,.2f}")
            return True
        except Exception as e:
            print(f"❌ Error fetching data: {e}")
            return False
    
    def create_sequences(self, data, seq_length):
        """Create sequences for LSTM training"""
        xs, ys = [], []
        for i in range(len(data) - seq_length):
            x = data[i:(i + seq_length)]
            y = data[i + seq_length]
            xs.append(x)
            ys.append(y)
        return np.array(xs), np.array(ys)
    
    def train_model(self, epochs=100):
        """Train the LSTM model"""
        print("\n🤖 Training LSTM Model...")
        
        # Normalize data
        df_normalized = self.scaler.fit_transform(self.data.values.reshape(-1, 1)).flatten()
        
        # Create sequences
        X, y = self.create_sequences(df_normalized, self.seq_length)
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # Initialize model
        self.model = LSTMModel(hidden_layer_size=self.hidden_size)
        optimizer = optim.Adam(self.model.parameters(), lr=0.001)
        loss_function = nn.MSELoss()
        
        # Training loop
        self.model.train()
        for epoch in range(epochs):
            epoch_loss = 0
            for seq, labels in zip(X_train, y_train):
                optimizer.zero_grad()
                self.model.hidden_cell = (
                    torch.zeros(1, 1, self.model.hidden_layer_size),
                    torch.zeros(1, 1, self.model.hidden_layer_size)
                )
                y_pred = self.model(torch.FloatTensor(seq))
                loss = loss_function(y_pred, torch.FloatTensor([labels]))
                loss.backward()
                torch.nn.utils.clip_grad_norm_(self.model.parameters(), 1.0)
                optimizer.step()
                epoch_loss += loss.item()
            
            if (epoch + 1) % 25 == 0:
                print(f'  Epoch {epoch+1}/{epochs} - Loss: {epoch_loss/len(X_train):.6f}')
        
        print("✓ Model training completed!")
        
    def predict_future(self):
        """Predict future prices using sliding window"""
        print(f"\n🔮 Predicting next {self.prediction_steps} days...")
        
        # Get last sequence
        last_sequence = self.data['Close'].values[-self.seq_length:]
        last_sequence_norm = self.scaler.transform(last_sequence.reshape(-1, 1)).flatten()
        
        # Multi-step prediction
        self.model.eval()
        predictions_norm = []
        temp_seq = last_sequence_norm.copy()
        
        with torch.no_grad():
            for step in range(self.prediction_steps):
                self.model.hidden_cell = (
                    torch.zeros(1, 1, self.model.hidden_layer_size),
                    torch.zeros(1, 1, self.model.hidden_layer_size)
                )
                y_pred = self.model(torch.FloatTensor(temp_seq))
                pred_value = y_pred.item()
                predictions_norm.append(pred_value)
                
                # Slide window
                temp_seq = np.append(temp_seq[1:], pred_value)
        
        # Inverse transform to actual prices
        predictions = self.scaler.inverse_transform(
            np.array(predictions_norm).reshape(-1, 1)
        ).flatten()
        
        return predictions
    
    def calculate_percentage_change(self, predictions):
        """Calculate percentage change from current price"""
        changes = []
        for pred in predictions:
            change = ((pred - self.current_price) / self.current_price) * 100
            changes.append(change)
        return changes
    
    def display_predictions(self, predictions):
        """Display prediction results with percentage changes"""
        print("\n" + "="*80)
        print("📊 BITCOIN PRICE PREDICTIONS")
        print("="*80)
        print(f"\n💰 Current Price: ${self.current_price:,.2f}")
        print(f"\n{'Day':<8} {'Predicted Price':<20} {'Change':<15} {'Signal':<10}")
        print("-" * 80)
        
        changes = self.calculate_percentage_change(predictions)
        
        for i, (pred, change) in enumerate(zip(predictions, changes)):
            signal = "🟢 BUY" if change > 0 else "🔴 SELL"
            sign = "+" if change >= 0 else ""
            print(f"Day {i+1:<4} ${pred:>12,.2f}        {sign}{change:>6.2f}%        {signal}")
        
        print("="*80)
        
        # Summary
        avg_change = np.mean(changes)
        final_change = changes[-1]
        
        print(f"\n📈 SUMMARY:")
        print(f"  Average Change: {avg_change:+.2f}%")
        print(f"  Day {self.prediction_steps} Change: {final_change:+.2f}%")
        print(f"  Trend: {'📈 BULLISH' if final_change > 0 else '📉 BEARISH'}")
        print("="*80)
        
        return changes
    
    def plot_predictions(self, predictions):
        """Plot historical data with future predictions (dotted line)"""
        print("\n📊 Generating prediction chart...")
        
        # Prepare data
        historical_prices = self.data['Close'].values[-30:]  # Last 30 days
        historical_dates = pd.date_range(
            end=datetime.now(), 
            periods=len(historical_prices), 
            freq='D'
        )
        
        # Future dates
        future_dates = pd.date_range(
            start=datetime.now() + timedelta(days=1),
            periods=self.prediction_steps,
            freq='D'
        )
        
        # Create plot
        plt.figure(figsize=(14, 7))
        
        # Plot historical prices (solid line)
        plt.plot(historical_dates, historical_prices, 
                'b-', linewidth=2, label='Historical Price', marker='o', markersize=4)
        
        # Connect last historical to first prediction
        connection_dates = [historical_dates[-1], future_dates[0]]
        connection_prices = [historical_prices[-1], predictions[0]]
        plt.plot(connection_dates, connection_prices, 
                'r--', linewidth=2, alpha=0.7)
        
        # Plot predictions (dotted line)
        plt.plot(future_dates, predictions, 
                'r--', linewidth=2, label='Predicted Price', 
                marker='s', markersize=6, alpha=0.7)
        
        # Formatting
        plt.axhline(y=self.current_price, color='gray', linestyle=':', alpha=0.5, label='Current Price')
        plt.xlabel('Date', fontsize=12)
        plt.ylabel('BTC Price (USD)', fontsize=12)
        plt.title('Bitcoin Price Prediction - LSTM Model', fontsize=14, fontweight='bold')
        plt.legend(fontsize=10)
        plt.grid(True, alpha=0.3)
        plt.xticks(rotation=45)
        plt.gca().yaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'${x:,.0f}'))
        plt.tight_layout()
        
        # Save plot
        plt.savefig('btc_prediction.png', dpi=150, bbox_inches='tight')
        print("✓ Chart saved as 'btc_prediction.png'")
        plt.show()
    
    def run(self):
        """Main execution flow"""
        print("\n" + "="*80)
        print("🤖 BITCOIN TRADING BOT - LSTM PRICE PREDICTOR")
        print("="*80)
        
        # Fetch data
        if not self.fetch_btc_data():
            return
        
        # Train model
        self.train_model(epochs=100)
        
        # Make predictions
        predictions = self.predict_future()
        
        # Display results
        self.display_predictions(predictions)
        
        # Plot results
        self.plot_predictions(predictions)
        
        print("\n✅ Analysis complete!")


if __name__ == "__main__":
    # Initialize and run bot
    bot = BTCTradingBot(
        seq_length=10,          # Use 10 days of history
        prediction_steps=5,      # Predict 5 days ahead
        hidden_size=64          # LSTM hidden layer size
    )
    
    try:
        bot.run()
    except KeyboardInterrupt:
        print("\n\n⚠️  Bot stopped by user")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()