#include "main_window.h"

namespace p2pc {
namespace client {

MainWindow::MainWindow(QWidget *parent) : QMainWindow(parent) {
    setWindowTitle("P2PC Client");
}

MainWindow::~MainWindow() = default;

}
}
