#include "dxgi_capture.h"

namespace p2pc {
namespace host {

DXGICapture::DXGICapture() {}
DXGICapture::~DXGICapture() { Cleanup(); }

bool DXGICapture::Initialize() { return true; }
void DXGICapture::CaptureFrame() {}
void DXGICapture::Cleanup() {}

}
}
