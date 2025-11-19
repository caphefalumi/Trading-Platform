# Predictions Controller - Changes Summary

## ✅ Issue Fixed

The predictions controller was using a **hardcoded BTC instrument ID** that wouldn't work with the dynamically seeded database.

## 🔧 Changes Made

### 1. **Dynamic Symbol-based Checking** (predictions.js)

**Before:**
```javascript
const BTC_INSTRUMENT_ID = '8211e04d-ace8-4e12-8338-dfdf16b6c8e0'
if (instrumentId !== BTC_INSTRUMENT_ID) {
  // reject...
}
```

**After:**
```javascript
const isBTC = instrument.symbol === 'BTCUSDT' || 
              instrument.symbol === 'BTC-USD' || 
              instrument.symbol === 'BTCUSD'

if (!isBTC) {
  // reject with better error message
}
```

### 2. **Improved Error Messages**

Now includes supported symbols in the error response:
```json
{
  "success": false,
  "error": "LSTM predictions currently only available for Bitcoin",
  "message": "This prediction model is trained specifically for Bitcoin...",
  "supportedSymbols": ["BTCUSDT", "BTC-USD", "BTCUSD"]
}
```

### 3. **Helper Script Added** (get_instrument_ids.js)

Run `npm run instruments` to get all instrument IDs:
```
📊 INSTRUMENTS:

📌 BTCUSDT - Bitcoin/Tether
   ID: 8211e04d-ace8-4e12-8338-dfdf16b6c8e0
   
📌 ETHUSDT - Ethereum/Tether
   ID: eac863e2-d76d-4477-a8c3-20b79370431e
   
📌 VOCUSDT - VOC Token/Tether
   ID: e0f447bd-22b9-4c70-9cd5-6fce27e538f7

💡 QUICK COPY - BTC Instrument ID for API testing:
   8211e04d-ace8-4e12-8338-dfdf16b6c8e0
```

## 🎯 Benefits

1. ✅ **Works with any database** - no hardcoded IDs
2. ✅ **Supports multiple BTC symbols** - BTCUSDT, BTC-USD, BTCUSD
3. ✅ **Better error messages** - tells users exactly what's supported
4. ✅ **Easy testing** - use `npm run instruments` to get IDs
5. ✅ **Flexible** - works with seeded data or manual data

## 📝 Usage

### Get Instrument IDs
```bash
npm run instruments
```

### Test Predictions API
```bash
# Get BTC prediction
curl http://localhost:3000/api/predictions/8211e04d-ace8-4e12-8338-dfdf16b6c8e0

# Try non-BTC instrument (will get helpful error)
curl http://localhost:3000/api/predictions/eac863e2-d76d-4477-a8c3-20b79370431e
```

### Expected Error for Non-BTC
```json
{
  "success": false,
  "error": "LSTM predictions currently only available for Bitcoin",
  "message": "This prediction model is trained specifically for Bitcoin. Other instruments are not yet supported.",
  "supportedSymbols": ["BTCUSDT", "BTC-USD", "BTCUSD"]
}
```

## 🔄 Both Controllers Updated

- ✅ `getPredictions()` - single instrument predictions
- ✅ `getBatchPredictions()` - batch predictions

Both now use symbol-based checking instead of hardcoded IDs.

---

**Files Modified:**
- `server/controllers/predictions.js` - Main fix
- `server/package.json` - Added `instruments` script
- `server/get_instrument_ids.js` - New helper script
