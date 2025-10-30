#include <iostream>
using namespace std;

int main() {
    int balance = 10000;
    int deposit;
    int withdraw;
    bool exit = false;
    while(!exit)
    {
        cout << "1. Deposit money \n 2. Withdraw money \n 3. Show balance \n 4. Exit \n";
        int choice;
        cin >> choice;

        switch(choice)
        {
            case 1:
                cout << "Enter amount to deposit: ";
                cin >> deposit;
                balance += deposit;
                break;
            case 4:
                exit = true;
                break;
            default:
                cout << "Invalid choice. Please try again." << endl;
        }
    }
    return 0;
}