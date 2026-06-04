#pragma once

namespace p2pc {
namespace host {

class DXGICapture {
public:
    DXGICapture();
    ~DXGICapture();

    bool Initialize();
    void CaptureFrame();
    void Cleanup();
};

}
}
