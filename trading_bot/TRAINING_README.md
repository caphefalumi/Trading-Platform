# Bitcoin Trading Bot - Training & Prediction System

## 📋 Overview

This system consists of two main components:
1. **bot.py** - Trains the LSTM model with database data
2. **predict_price.py** - Loads the trained model and makes predictions

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
pip install torch numpy pandas matplotlib pymysql scikit-learn pickle
```

### Step 2: Train the Model

```bash
python src/bot.py
```

**What it does:**
- ✅ Fetches Bitcoin price data from MySQL database
- ✅ Trains LSTM model for 200 epochs with early stopping
- ✅ Prevents overfitting and exploding gradients
- ✅ Saves the best model automatically
- ✅ Generates training history chart

**Output Files:**
- `best_btc_lstm_model.pth` - Trained model
- `scaler.pkl` - Data normalizer
- `training_history.png` - Training visualization

**Early Stopping:**
- Monitors validation loss
- Stops if no improvement for 20 epochs
- Prevents overfitting
- Saves best model automatically

### Step 3: Make Predictions

```bash
python src/predict_price.py
```

**What it does:**
- ✅ Loads the best trained model
- ✅ Fetches latest Bitcoin prices from database
- ✅ Predicts next 5 days of prices
- ✅ Calculates percentage changes vs yesterday
- ✅ Provides BUY/SELL recommendations
- ✅ Generates prediction chart with dotted line

**Output:**
- Price predictions for next 5 days
- Percentage changes (vs yesterday)
- Day-to-day changes
- BUY/SELL signals
- Trend analysis (BULLISH/BEARISH)
- Visualization with dotted prediction line

## 📊 Sample Output

### Training Output:
```
🤖 BITCOIN TRADING BOT - TRAINING MODE
════════════════════════════════════════════════════════════════════════════════

📊 Fetching Bitcoin data from database...
✓ Fetched 365 records from database
📅 Date range: 2024-11-15 to 2025-11-15
📈 Current BTC Price: $93,456.78

🤖 Training LSTM Model (max 200 epochs with early stopping)...
  Epoch 10/200 - Train Loss: 0.002345, Val Loss: 0.002567
  Epoch 20/200 - Train Loss: 0.001234, Val Loss: 0.001456
  💾 Model saved to best_btc_lstm_model.pth
  ...

⚠️  Early stopping triggered at epoch 85
  Best model was at epoch 78 with Val Loss: 0.001123

✓ Model training completed!
  Best Epoch: 78
  Best Validation Loss: 0.001123
```

### Prediction Output:
```
📊 BITCOIN PRICE PREDICTIONS - NEXT 5 DAYS
════════════════════════════════════════════════════════════════════════════════

💰 Yesterday's Price: $92,345.67
💰 Current Price (Today): $93,456.78
📊 Today vs Yesterday: +1.20% 🟢 UP

Day        Date            Predicted Price      vs Yesterday       Day Change      Signal
────────────────────────────────────────────────────────────────────────────────────────
Day 1      2025-11-16      $94,123.45          +1.92%            +0.71%          🟢 BUY
Day 2      2025-11-17      $95,234.12          +3.13%            +1.18%          🟢 BUY
Day 3      2025-11-18      $94,890.23          +2.76%            -0.36%          🟢 BUY
Day 4      2025-11-19      $95,678.90          +3.61%            +0.83%          🟢 BUY
Day 5      2025-11-20      $96,012.34          +4.97%            +0.35%          🟢 BUY

📈 ANALYSIS SUMMARY:
  Average Change (vs Yesterday): +3.28%
  Day 5 Change (vs Yesterday): +4.97%
  5-Day Total Change: +4.97%
  Expected Price on Day 5: $96,012.34

📊 TREND ANALYSIS:
  Upward days: 4/5
  Downward days: 1/5
  Overall Trend: 📈 STRONG BULLISH

💡 RECOMMENDATION: 🟢 STRONG BUY - Good upward momentum expected
```

## 🎯 Features

### Training Features (bot.py):
- **Database Integration**: Fetches data from MySQL (no YFinance dependency)
- **Early Stopping**: Prevents overfitting (patience=20 epochs)
- **Gradient Clipping**: Prevents exploding gradients (max_norm=1.0)
- **Validation Split**: 80/20 train/validation (no shuffle for time series)
- **Best Model Saving**: Automatically saves model with lowest validation loss
- **Training Visualization**: Plots training/validation loss curves

### Prediction Features (predict_price.py):
- **Model Loading**: Loads best trained model automatically
- **Real-time Data**: Fetches latest prices from database
- **Multi-step Prediction**: Predicts 5 days ahead using sliding window
- **Percentage Calculations**: 
  - Change vs yesterday's price
  - Day-to-day changes
  - Today's performance
- **Buy/Sell Signals**: Automated recommendations based on predictions
- **Trend Analysis**: BULLISH/BEARISH classification
- **Visualization**: 
  - Historical prices (solid blue line)
  - Predicted prices (dotted red line)
  - Percentage change bar chart

## 🔧 Configuration

### Database Configuration:
Database credentials are stored in `server/.env` file:
```bash
DB_HOST="your-database-host"
DB_PORT=3306
DB_USER="your-username"
DB_PASSWORD="your-password"
DB_NAME="your-database-name"
DB_CHARSET="utf8mb4"
```

Both scripts (`bot.py` and `predict_price.py`) load configuration from this `.env` file automatically.

### Model Hyperparameters:
```python
seq_length = 10          # Use 10 days of historical data
prediction_steps = 5     # Predict 5 days ahead
hidden_size = 64         # LSTM hidden layer size
epochs = 200             # Maximum training epochs
patience = 20            # Early stopping patience
learning_rate = 0.001    # Adam optimizer learning rate
```

## 📈 Model Architecture

- **Input**: 10-day sequence of normalized prices
- **LSTM Layer**: 64 hidden units
- **Output Layer**: Single price prediction
- **Activation**: Default LSTM activations (tanh, sigmoid)
- **Optimizer**: Adam with learning rate 0.001
- **Loss Function**: Mean Squared Error (MSE)
- **Regularization**: Gradient clipping (max_norm=1.0)

## 📁 File Structure

```
trading_bot/
├── src/
│   ├── bot.py                    # Training script
│   ├── predict_price.py          # Prediction script
│   └── ...
├── best_btc_lstm_model.pth       # Trained model (generated)
├── scaler.pkl                    # Data scaler (generated)
├── training_history.png          # Training chart (generated)
├── btc_prediction.png            # Prediction chart (generated)
└── TRAINING_README.md            # This file
```

## 🔄 Workflow

1. **Data Collection**: Fetch historical Bitcoin prices from database
2. **Preprocessing**: Normalize prices using MinMaxScaler (0-1 range)
3. **Training**: Train LSTM with early stopping and gradient clipping
4. **Validation**: Monitor validation loss to prevent overfitting
5. **Model Saving**: Save best model based on validation performance
6. **Prediction**: Load model and predict next 5 days
7. **Analysis**: Calculate percentage changes and generate signals
8. **Visualization**: Plot predictions with dotted line

## 💡 Tips

- **Run training first**: Always train the model before running predictions
- **Retrain regularly**: Retrain weekly with new data for better accuracy
- **Monitor training**: Check training_history.png for overfitting signs
- **Database freshness**: Ensure database has latest prices before prediction
- **Multiple predictions**: Run predict_price.py daily for updated forecasts

## ⚠️ Important Notes

1. **Early Stopping**: Training may stop before 200 epochs if no improvement
2. **Time Series**: Validation split doesn't shuffle to preserve time order
3. **Gradient Clipping**: Prevents exploding gradients during training
4. **Data Requirements**: Need at least 10+ days of historical data
5. **Predictions**: Use sliding window approach (autoregressive)

## 🎨 Visualization Explained

### Training History Chart:
- Blue line: Training loss over epochs
- Orange line: Validation loss over epochs
- Red dashed line: Best epoch marker

### Prediction Chart:
- **Top Panel**: Price prediction
  - Blue solid line: Historical prices (last 30 days)
  - Red dotted line: Future predictions (next 5 days)
  - Green dashed line: Current price reference
  - Orange dashed line: Yesterday's price reference
- **Bottom Panel**: Percentage changes
  - Green bars: Positive change (BUY signal)
  - Red bars: Negative change (SELL signal)

## 📞 Support

For issues or questions:
1. Check training_history.png for training problems
2. Verify database connection and data availability
3. Ensure all dependencies are installed
4. Check model file exists before prediction

---

**Last Updated**: November 15, 2025
**Model Version**: LSTM with Early Stopping v1.0
