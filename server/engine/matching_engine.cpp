#include "matching_engine.hpp"
#include <iostream>
#include <sstream>
#include <chrono>

// MatchingEngine::MatchingEngine() 
//     : context(1), python_socket(context, ZMQ_REP) {
//     python_socket.bind("tcp://*:5555");
// }

// MatchingEngine::~MatchingEngine() {
//     python_socket.close();
//     context.close();
// }



std::vector<Trade> OrderBook::addOrder(Order order) {
    std::lock_guard<std::mutex> lock(book_mutex);
    std::vector<Trade> trades;
    
    if (order.side == "BUY") {
        while (order.quantity > 0 && !asks.empty() && asks.begin()->first <= order.price) {
            auto& askQueue = asks.begin()->second;
            
            while (!askQueue.empty() && order.quantity > 0) {
                Order& askOrder = askQueue.front();
                double tradeQuantity = std::min(order.quantity, askOrder.quantity);
                double tradePrice = askOrder.price;
                
                // Create trade
                Trade trade;
                trade.trade_id = "TRADE_" + std::to_string(std::chrono::system_clock::now().time_since_epoch().count());
                trade.buy_order_id = order.id;
                trade.sell_order_id = askOrder.id;
                trade.instrument = order.instrument;
                trade.price = tradePrice;
                trade.quantity = tradeQuantity;
                trade.timestamp = std::chrono::system_clock::now().time_since_epoch().count();
                trades.push_back(trade);
                
                // Update quantities
                order.quantity -= tradeQuantity;
                askOrder.quantity -= tradeQuantity;
                order.filled_quantity += tradeQuantity;
                askOrder.filled_quantity += tradeQuantity;
                
                // Remove filled ask order
                if (askOrder.quantity == 0) {
                    askQueue.pop();
                }
                
                if (order.quantity == 0) break;
            }
            
            if (askQueue.empty()) {
                asks.erase(asks.begin());
            }
            
            if (order.quantity == 0) break;
        }
        
        // Add remaining order to book
        if (order.quantity > 0) {
            bids[order.price].push(order);
        }
        
    } else if (order.side == "SELL") {
        while (order.quantity > 0 && !bids.empty() && bids.begin()->first >= order.price) {
            auto& bidQueue = bids.begin()->second;
            
            while (!bidQueue.empty() && order.quantity > 0) {
                Order& bidOrder = bidQueue.front();
                double tradeQuantity = std::min(order.quantity, bidOrder.quantity);
                double tradePrice = bidOrder.price;
                
                // Create trade
                Trade trade;
                trade.trade_id = "TRADE_" + std::to_string(std::chrono::system_clock::now().time_since_epoch().count());
                trade.buy_order_id = bidOrder.id;
                trade.sell_order_id = order.id;
                trade.instrument = order.instrument;
                trade.price = tradePrice;
                trade.quantity = tradeQuantity;
                trade.timestamp = std::chrono::system_clock::now().time_since_epoch().count();
                trades.push_back(trade);
                
                // Update quantities
                order.quantity -= tradeQuantity;
                bidOrder.quantity -= tradeQuantity;
                order.filled_quantity += tradeQuantity;
                bidOrder.filled_quantity += tradeQuantity;
                
                // Remove filled bid order
                if (bidOrder.quantity == 0) {
                    bidQueue.pop();
                }
                
                if (order.quantity == 0) break;
            }
            
            if (bidQueue.empty()) {
                bids.erase(bids.begin());
            }
            
            if (order.quantity == 0) break;
        }
        
        // Add remaining order to book
        if (order.quantity > 0) {
            asks[order.price].push(order);
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
        sendToPython(msg.str());
    }
}

// void MatchingEngine::run() {
//     std::cout << "Matching Engine started on port 5555" << std::endl;
    
//     while (true) {
//         // zmq::message_t request;
//         // python_socket.recv(request, zmq::recv_flags::none);
        
//         // std::string message(static_cast<char*>(request.data()), request.size());
//         // std::cout << "Received: " << message << std::endl;
//         // // Format: "NEW_ORDER|order_id|instrument|side|price|quantity|client_order_id"
//         // zmq::message_t reply(5);
//         // memcpy(reply.data(), "ACK", 5);
//         // python_socket.send(reply, zmq::send_flags::none);
//     }
// }

// Add these at the end of the file:

void MatchingEngine::sendToPython(const std::string&) {
    // No-op for testing
}

MatchingEngine::MatchingEngine() {
    // No-op for testing
}

MatchingEngine::~MatchingEngine() {
    // No-op for testing
}