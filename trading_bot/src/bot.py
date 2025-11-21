"""
BTC Trading Bot with LSTM Price Prediction
Fetches data from MySQL database and trains model with early stopping
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import torch
import torch.nn as nn
import torch.optim as optim
import pymysql
from datetime import datetime, timedelta
from sklearn.preprocessing import MinMaxScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error
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
        self.best_model_path = 'best_btc_lstm_model.pth'
        self.scaler_path = 'scaler.pkl'
        self.best_val_loss = float('inf')
        self.patience_counter = 0
        
        # Setup device (GPU if available, otherwise CPU)
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        print(f"Using device: {self.device}")
        if torch.cuda.is_available():
            print(f"   GPU: {torch.cuda.get_device_name(0)}")
            print(f"   CUDA Version: {torch.version.cuda}")
            print(f"   Memory Available: {torch.cuda.get_device_properties(0).total_memory / 1e9:.2f} GB")
        
    def fetch_btc_data_from_db(self):
        """Fetch Bitcoin price data from MySQL database"""
        print("Fetching Bitcoin data from database...")
        try:
            connection = pymysql.connect(**DB_CONFIG)
            cursor = connection.cursor()
            
            # Fetch instrument_prices data
            cursor.execute("""
                SELECT timestamp, close_price 
                FROM instrument_prices 
                WHERE instrument_id = '2376ac2b-fe9f-41ad-bb47-deb6d30d3253'
                ORDER BY timestamp ASC
            """)
            
            rows = cursor.fetchall()
            connection.close()
            
            if not rows:
                print("No data found in database")
                return False
            
            # Convert to DataFrame
            df = pd.DataFrame(rows)
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            df['close_price'] = df['close_price'].astype(float)  # Convert Decimal to float
            df = df.rename(columns={'close_price': 'Close', 'timestamp': 'Date'})
            df = df.set_index('Date')
            
            self.data = df[['Close']].copy()
            self.current_price = float(self.data['Close'].iloc[-1])
            
            print(f"Fetched {len(self.data)} records from database")
            print(f"Date range: {df.index[0]} to {df.index[-1]}")
            print(f"Current BTC Price: ${self.current_price:,.2f}")
            return True
            
        except Exception as e:
            print(f"Error fetching data from database: {e}")
            import traceback
            traceback.print_exc()
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
    
    def save_model(self):
        """Save the best model and scaler"""
        torch.save({
            'model_state_dict': self.model.state_dict(),
            'hidden_size': self.hidden_size,
            'seq_length': self.seq_length,
            'prediction_steps': self.prediction_steps,
            'best_val_loss': self.best_val_loss
        }, self.best_model_path)
        
        # Save scaler
        with open(self.scaler_path, 'wb') as f:
            pickle.dump(self.scaler, f)
        print(f"Model saved to {self.best_model_path}")
    
    def plot_training_history(self, train_losses, val_losses, best_epoch):
        """Plot training and validation loss"""
        plt.figure(figsize=(10, 6))
        plt.plot(train_losses, label='Training Loss', linewidth=2)
        plt.plot(val_losses, label='Validation Loss', linewidth=2)
        plt.axvline(x=best_epoch-1, color='red', linestyle='--', label=f'Best Epoch ({best_epoch})', alpha=0.7)
        plt.xlabel('Epoch', fontsize=12)
        plt.ylabel('Loss (MSE)', fontsize=12)
        plt.title('Training History with Early Stopping', fontsize=14, fontweight='bold')
        plt.legend(fontsize=10)
        plt.grid(True, alpha=0.3)
        plt.tight_layout()
        plt.savefig('training_history.png', dpi=150, bbox_inches='tight')
        print("Training history saved as 'training_history.png'")
        plt.close()
    
    def train_model(self, epochs=200, patience=20):
        """Train the LSTM model with early stopping on GPU/CPU"""
        print(f"\nTraining LSTM Model (max {epochs} epochs with early stopping)...")
        print(f"   Device: {self.device}")
        
        # Normalize data
        df_normalized = self.scaler.fit_transform(self.data['Close'].values.reshape(-1, 1)).flatten()
        
        # Create sequences
        X, y = self.create_sequences(df_normalized, self.seq_length)
        X_train, X_val, y_train, y_val = train_test_split(
            X, y, test_size=0.2, random_state=42, shuffle=False  # Don't shuffle for time series
        )
        
        # Initialize model and move to device (GPU/CPU)
        self.model = LSTMModel(hidden_layer_size=self.hidden_size).to(self.device)
        optimizer = optim.Adam(self.model.parameters(), lr=0.001)
        loss_function = nn.MSELoss()
        
        # Training loop with early stopping
        train_losses = []
        val_losses = []
        best_epoch = 0
        
        for epoch in range(epochs):
            # Training phase
            self.model.train()
            epoch_train_loss = 0
            for seq, labels in zip(X_train, y_train):
                optimizer.zero_grad()
                
                # Move hidden states to device
                self.model.hidden_cell = (
                    torch.zeros(1, 1, self.model.hidden_layer_size).to(self.device),
                    torch.zeros(1, 1, self.model.hidden_layer_size).to(self.device)
                )
                
                # Move data to device
                seq_tensor = torch.FloatTensor(seq).to(self.device)
                label_tensor = torch.FloatTensor([labels]).to(self.device)
                
                y_pred = self.model(seq_tensor)
                loss = loss_function(y_pred, label_tensor)
                loss.backward()
                torch.nn.utils.clip_grad_norm_(self.model.parameters(), 1.0)  # Prevent exploding gradients
                optimizer.step()
                epoch_train_loss += loss.item()
            
            avg_train_loss = epoch_train_loss / len(X_train)
            train_losses.append(avg_train_loss)
            
            # Validation phase
            self.model.eval()
            epoch_val_loss = 0
            with torch.no_grad():
                for seq, labels in zip(X_val, y_val):
                    # Move hidden states to device
                    self.model.hidden_cell = (
                        torch.zeros(1, 1, self.model.hidden_layer_size).to(self.device),
                        torch.zeros(1, 1, self.model.hidden_layer_size).to(self.device)
                    )
                    
                    # Move data to device
                    seq_tensor = torch.FloatTensor(seq).to(self.device)
                    label_tensor = torch.FloatTensor([labels]).to(self.device)
                    
                    y_pred = self.model(seq_tensor)
                    loss = loss_function(y_pred, label_tensor)
                    epoch_val_loss += loss.item()
            
            avg_val_loss = epoch_val_loss / len(X_val)
            val_losses.append(avg_val_loss)
            
            # Print progress
            if (epoch + 1) % 10 == 0:
                print(f'  Epoch {epoch+1}/{epochs} - Train Loss: {avg_train_loss:.6f}, Val Loss: {avg_val_loss:.6f}')
            
            # Early stopping and save best model
            if avg_val_loss < self.best_val_loss:
                self.best_val_loss = avg_val_loss
                best_epoch = epoch + 1
                self.patience_counter = 0
                # Save best model
                self.save_model()
            else:
                self.patience_counter += 1
                if self.patience_counter >= patience:
                    print(f"\nEarly stopping triggered at epoch {epoch+1}")
                    print(f"  Best model was at epoch {best_epoch} with Val Loss: {self.best_val_loss:.6f}")
                    break
        
        print(f"\nModel training completed!")
        print(f"  Best Epoch: {best_epoch}")
        print(f"  Best Validation Loss: {self.best_val_loss:.6f}")
        print(f"  Final Train Loss: {train_losses[-1]:.6f}")
        print(f"  Final Val Loss: {val_losses[-1]:.6f}")
        
        # Plot training history
        self.plot_training_history(train_losses, val_losses, best_epoch)
        
        return train_losses, val_losses
        
    def predict_future(self):
        """Predict future prices using sliding window on GPU/CPU"""
        print(f"\nPredicting next {self.prediction_steps} days...")
        
        # Get last sequence
        last_sequence = self.data['Close'].values[-self.seq_length:]
        last_sequence_norm = self.scaler.transform(last_sequence.reshape(-1, 1)).flatten()
        
        # Multi-step prediction
        self.model.eval()
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
        print("BITCOIN PRICE PREDICTIONS")
        print("="*80)
        print(f"\nCurrent Price: ${self.current_price:,.2f}")
        print(f"\n{'Day':<8} {'Predicted Price':<20} {'Change':<15} {'Signal':<10}")
        print("-" * 80)
        
        changes = self.calculate_percentage_change(predictions)
        
        for i, (pred, change) in enumerate(zip(predictions, changes)):
            signal = "BUY" if change > 0 else "SELL"
            sign = "+" if change >= 0 else ""
            print(f"Day {i+1:<4} ${pred:>12,.2f}        {sign}{change:>6.2f}%        {signal}")
        
        print("="*80)
        
        # Summary
        avg_change = np.mean(changes)
        final_change = changes[-1]
        
        print(f"\nSUMMARY:")
        print(f"  Average Change: {avg_change:+.2f}%")
        print(f"  Day {self.prediction_steps} Change: {final_change:+.2f}%")
        print(f"  Trend: {'BULLISH' if final_change > 0 else 'BEARISH'}")
        print("="*80)
        
        return changes
    
    def plot_predictions(self, predictions):
        """Plot historical data with future predictions (dotted line)"""
        print("\nGenerating prediction chart...")
        
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
        """Main execution flow - Training mode"""
        print("\n" + "="*80)
        print("BITCOIN TRADING BOT - TRAINING MODE")
        print("="*80)
        
        # Fetch data from database
        if not self.fetch_btc_data_from_db():
            print("\nFailed to fetch data from database")
            return
        
        # Train model with early stopping
        print("\n" + "="*80)
        print("Starting training with early stopping (patience=20)...")
        print("This will prevent overfitting and exploding gradients")
        print("="*80)
        self.train_model(epochs=200, patience=20)
        
        print("\n" + "="*80)
        print("Training Complete!")
        print("="*80)
        print(f"\nSaved Files:")
        print(f"  - Best model: {self.best_model_path}")
        print(f"  - Scaler: {self.scaler_path}")
        print(f"  - Training history: training_history.png")
        print(f"\nNext step: Run 'predict_price.py' to make predictions!")
        print("="*80)


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
        print("\n\nBot stopped by user")
    except Exception as e:
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()