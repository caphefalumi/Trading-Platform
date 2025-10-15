# bot.py

import time
from strategies import Strategy
from config.settings import API_KEY, TRADING_PARAMETERS

class TradingBot:
    def __init__(self):
        self.strategy = Strategy()
        self.running = True

    def start(self):
        print("Starting trading bot...")
        while self.running:
            self.run_strategy()
            time.sleep(TRADING_PARAMETERS['interval'])

    def run_strategy(self):
        # Implement the logic to execute the trading strategy
        self.strategy.execute()

    def stop(self):
        print("Stopping trading bot...")
        self.running = False

if __name__ == "__main__":
    bot = TradingBot()
    try:
        bot.start()
    except KeyboardInterrupt:
        bot.stop()