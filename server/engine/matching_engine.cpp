#include "matching_engine.hpp"
#include <iostream>
#include <sstream>
#include <algorithm>

MatchingEngine::MatchingEngine() 
    : context(1), nodejs_socket(context, ZMQ_REP) {
    nodejs_socket.bind("tcp://*:5555");
    std::cout << "Matching Engine listening on port 5555" << std::endl;
}

MatchingEngine::~MatchingEngine() {
    nodejs_socket.close();
    context.close();
}

std::vector<Trade> OrderBook::addOrder(const Order& order) {
    std::lock_guard<std::mutex> lock(book_mutex);
    std::vector<Trade> trades;
    
    Order workingOrder = order;
    
    if (order.side == "BUY") {
        for (auto it = asks.begin(); it != asks.end() && workingOrder.quantity > 0; ) {
            double askPrice = it->first;
            
            if (workingOrder.price < askPrice) break;
            
            auto& askQueue = it->second;
            
            while (!askQueue.empty() && workingOrder.quantity > 0) {
                Order& askOrder = askQueue.front();
                double tradeQuantity = std::min(workingOrder.quantity, askOrder.quantity);
                
                Trade trade;
                trade.trade_id = "TRADE_" + std::to_string(std::chrono::system_clock::now().time_since_epoch().count());
                trade.buy_order_id = workingOrder.id;
                trade.sell_order_id = askOrder.id;
                trade.instrument = workingOrder.instrument;
                trade.price = askOrder.price;
                trade.quantity = tradeQuantity;
                trade.timestamp = std::chrono::system_clock::now().time_since_epoch().count();
                trades.push_back(trade);
                
                workingOrder.quantity -= tradeQuantity;
                askOrder.quantity -= tradeQuantity;
                
                if (askOrder.quantity == 0) {
                    askQueue.pop();
                } else {
                    break;
                }
            }
            
            if (askQueue.empty()) {
                it = asks.erase(it);
            } else {
                ++it;
            }
        }
        
        if (workingOrder.quantity > 0) {
            bids[workingOrder.price].push(workingOrder);
        }
        
    } else if (order.side == "SELL") {
        for (auto it = bids.begin(); it != bids.end() && workingOrder.quantity > 0; ) {
            double bidPrice = it->first;
            
            if (workingOrder.price > bidPrice) break;
            
            auto& bidQueue = it->second;
            
            while (!bidQueue.empty() && workingOrder.quantity > 0) {
                Order& bidOrder = bidQueue.front();
                double tradeQuantity = std::min(workingOrder.quantity, bidOrder.quantity);
                
                Trade trade;
                trade.trade_id = "TRADE_" + std::to_string(std::chrono::system_clock::now().time_since_epoch().count());
                trade.buy_order_id = bidOrder.id;
                trade.sell_order_id = workingOrder.id;
                trade.instrument = workingOrder.instrument;
                trade.price = bidOrder.price;
                trade.quantity = tradeQuantity;
                trade.timestamp = std::chrono::system_clock::now().time_since_epoch().count();
                trades.push_back(trade);
                
                workingOrder.quantity -= tradeQuantity;
                bidOrder.quantity -= tradeQuantity;
                
                if (bidOrder.quantity == 0) {
                    bidQueue.pop();
                } else {
                    break;
                }
            }
            
            if (bidQueue.empty()) {
                it = bids.erase(it);
            } else {
                ++it;
            }
        }
        
        if (workingOrder.quantity > 0) {
            asks[workingOrder.price].push(workingOrder);
        }
    }
    
    return trades;
}

void MatchingEngine::processOrder(const Order& order) {
    std::lock_guard<std::mutex> lock(engine_mutex);
    
    OrderBook& book = orderBooks[order.instrument];
    std::vector<Trade> trades = book.addOrder(order);
    
    for (const auto& trade : trades) {
        std::ostringstream msg;
        msg << "TRADE|" << trade.trade_id << "|" << trade.buy_order_id << "|" 
            << trade.sell_order_id << "|" << trade.instrument << "|" << trade.price 
            << "|" << trade.quantity << "|" << trade.timestamp;
        sendToNodeJS(msg.str());
    }
}

std::string MatchingEngine::processCommand(const std::string& command) {
    std::istringstream iss(command);
    std::string cmd;
    iss >> cmd;
    
    if (cmd == "NEW_ORDER") {
        Order order;
        std::string instrument, side;
        
        iss >> order.id >> instrument >> side >> order.price >> order.quantity;
        order.instrument = instrument;
        order.side = side;
        order.client_order_id = order.id;
        order.timestamp = std::chrono::system_clock::now().time_since_epoch().count();
        
        processOrder(order);
        return "ORDER_ACCEPTED";
        
    } else if (cmd == "PING") {
        return "PONG";
        
    } else {
        return "UNKNOWN_COMMAND";
    }
}

void MatchingEngine::run() {
    while (true) {
        zmq::message_t request;
        nodejs_socket.recv(request, zmq::recv_flags::none);
        
        std::string message(static_cast<char*>(request.data()), request.size());
        std::string response = processCommand(message);
        
        zmq::message_t reply(response.size());
        memcpy(reply.data(), response.c_str(), response.size());
        nodejs_socket.send(reply, zmq::send_flags::none);
    }
}

void MatchingEngine::sendToNodeJS(const std::string& message) {
    // For push notifications to Node.js (would need another socket)
    std::cout << "TRADE_NOTIFICATION: " << message << std::endl;
}