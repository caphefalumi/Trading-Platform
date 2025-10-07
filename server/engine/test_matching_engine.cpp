#include "matching_engine.hpp"
#include <iostream>

int main() {
    MatchingEngine engine;

    Order buyOrder;
    buyOrder.id = "B1";
    buyOrder.instrument = "BTC";
    buyOrder.side = "BUY";
    buyOrder.price = 100.0;
    buyOrder.quantity = 10;
    buyOrder.filled_quantity = 0;

    Order sellOrder;
    sellOrder.id = "S1";
    sellOrder.instrument = "BTC";
    sellOrder.side = "SELL";
    sellOrder.price = 99.0;
    sellOrder.quantity = 10;
    sellOrder.filled_quantity = 0;

    // Process orders
    engine.processOrder(buyOrder);
    engine.processOrder(sellOrder);

    // You can add more orders and print results as needed
    std::cout << "Test completed." << std::endl;
    return 0;
}