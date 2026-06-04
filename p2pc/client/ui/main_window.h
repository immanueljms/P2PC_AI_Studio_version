#pragma once
#include <QMainWindow>

namespace p2pc {
namespace client {

class MainWindow : public QMainWindow {
    Q_OBJECT
public:
    explicit MainWindow(QWidget *parent = nullptr);
    ~MainWindow();
};

}
}
