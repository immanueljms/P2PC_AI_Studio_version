#pragma once
#include <QMainWindow>

namespace p2pc {
namespace host {

class MainWindow : public QMainWindow {
    Q_OBJECT
public:
    explicit MainWindow(QWidget *parent = nullptr);
    ~MainWindow();
};

}
}
