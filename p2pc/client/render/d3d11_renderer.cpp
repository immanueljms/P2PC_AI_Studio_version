#include "d3d11_renderer.h"

namespace p2pc {
namespace client {

D3D11Renderer::D3D11Renderer() {}
D3D11Renderer::~D3D11Renderer() { Cleanup(); }

bool D3D11Renderer::Initialize() { return true; }
void D3D11Renderer::RenderFrame() {}
void D3D11Renderer::Cleanup() {}

}
}
