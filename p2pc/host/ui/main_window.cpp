#include "main_window.h"

namespace p2pc {
namespace host {

MainWindow::MainWindow(QWidget *parent) : QMainWindow(parent) {
    setWindowTitle("P2PC Host");
}

MainWindow::~MainWindow() = default;

}
}
