#pragma once
#include <unordered_map>
#include <queue>
#include <string>
#include <mutex>
#include <map>
#include <vector>
#include <chrono>
#include <zmq.hpp>

struct Order {
    std::string id;
    std::string instrument;
    std::string side;  // "BUY" or "SELL"
    double price;
    double quantity;
    double filled_quantity = 0.0;
    std::string status = "PENDING";
    std::string client_order_id;
    long timestamp;
};

struct Trade {
    std::string trade_id;
    std::string buy_order_id;
    std::string sell_order_id;
    std::string instrument;
    double price;
    double quantity;
    long timestamp;
};

class OrderBook {
private:
    std::map<double, std::queue<Order>, std::greater<double>> bids;
    std::map<double, std::queue<Order>> asks;
    std::mutex book_mutex;

public:
    std::vector<Trade> addOrder(const Order& order);
    std::string getOrderBookSnapshot();
    double getBestBid();
    double getBestAsk();
};

class MatchingEngine {
private:
    std::unordered_map<std::string, OrderBook> orderBooks;
    zmq::context_t context;
    zmq::socket_t nodejs_socket;
    std::mutex engine_mutex;

    std::string generateTradeId();
    void sendToNodeJS(const std::string& message);

public:
    MatchingEngine();
    ~MatchingEngine();
    
    void processOrder(const Order& order);
    std::string processCommand(const std::string& command);
    void run();
};