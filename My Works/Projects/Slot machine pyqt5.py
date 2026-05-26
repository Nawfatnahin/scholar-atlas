
import sys
import random
from PyQt5.QtWidgets import (QApplication, QLineEdit, QPushButton, QVBoxLayout, QHBoxLayout,
                             QWidget, QLabel)
from PyQt5.QtCore import Qt


class SlotMachine(QWidget):

    def __init__(self):
        super().__init__()
        self.setWindowTitle("SlotMachine")
        self.balance = 100
        self.title_label = QLabel("SLOT MACHINE",self)
        self.input_bet = QLineEdit(self)
        self.input_button = QPushButton("Enter Your Bet",self)
        self.symbols_label = QLabel(" 🍉|🍒|⭐ ",self)
        self.print_row_label = QLabel("",self)
        self.balance_label = QLabel(f"Your Balance is : ${self.balance}",self)
        self.initUI()
        self.input_button.clicked.connect(self.game_play)

    def initUI(self):

        vbox = QVBoxLayout()
        vbox.addWidget(self.title_label)
        vbox.addWidget(self.symbols_label)
        vbox.addWidget(self.balance_label)
        vbox.addWidget(self.input_bet)
        vbox.addWidget(self.input_button)
        vbox.addWidget(self.print_row_label)

        self.setLayout(vbox)

        self.symbols_label.setAlignment(Qt.AlignCenter)
        self.title_label.setAlignment(Qt.AlignCenter)
        self.print_row_label.setAlignment(Qt.AlignCenter)
        self.input_bet.setAlignment(Qt.AlignCenter)

        self.symbols_label.setObjectName("symbols_label")
        self.title_label.setObjectName("title_label")
        self.print_row_label.setObjectName("print_row_label")
        self.input_bet.setObjectName("input_bet")
        self.input_button.setObjectName("input_button")
        self.balance_label.setObjectName("balance_label")

        self.setStyleSheet("""
        QLabel#title_label{
            font-size:50px;
            color: green;
            font-weight: bold;
            font-family: Roboto; 
        }
        QPushButton#input_button{
            font-size:25px;
            font-weight: bold;
        }
        QLabel#symbols_label{
            font-size:45px;
        }
        QLabel#print_row_label{
            font-size:50px;
        }
        QLabel#balance_label{
            font-size:20px;
        }
        """)



    def game_play(self):
        try:
            self.bet = int(self.input_bet.text())
        except:
            self.print_row_label.setText(" Invalid ")
            return

        if self.bet > self.balance:
            self.print_row_label.setText("Insufficient Balance")
            return

        elif self.bet <= 0:
            self.print_row_label.setText("bet must be greater than 0")
            return

        self.balance -= self.bet

        self.row = self.spin_row()

        self.print_row_label.setText(" | ".join(self.row))

        payout = self.get_payout()

        if  payout > 0:
            self.balance += payout
            self.print_row_label.setText(" | ".join(self.row) + f"\n Yow win ${payout}")
        else:
            self.print_row_label.setText(" | ".join(self.row) + f"\n You lose!")

        self.balance_label.setText(f" Your Balance : ${self.balance}")




    def spin_row(self):
        self.symbols =  ['🍉','🍒','⭐']
        return [random.choice(self.symbols) for _ in range(3)]


    def get_payout(self):
        if self.row[0] == self.row[1] == self.row[2]:
            if self.row[0] == '🍉':
                return self.bet * 5
            elif self.row[0] == '🍒':
                return self.bet * 2
            elif self.row[0] == '⭐':
                return self.bet * 3
        else:
            return 0


if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = SlotMachine()
    window.show()
    sys.exit(app.exec_())