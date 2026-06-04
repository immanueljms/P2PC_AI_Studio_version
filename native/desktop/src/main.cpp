#include <QApplication>
#include <QMessageBox>
#include "ui/MainWindow.h"

int main(int argc, char *argv[]) {
    QApplication app(argc, argv);
    
    // Set up native Windows scaling and attributes
    QApplication::setHighDpiScaleFactorRoundingPolicy(Qt::HighDpiScaleFactorRoundingPolicy::PassThrough);
    
    MainWindow window;
    window.setWindowTitle("P2PC Native (DirectX 11 / WebRTC)");
    window.resize(1024, 768);
    window.show();

    return app.exec();
}
