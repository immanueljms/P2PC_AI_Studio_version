#pragma once

namespace p2pc {
namespace client {

class D3D11Renderer {
public:
    D3D11Renderer();
    ~D3D11Renderer();

    bool Initialize();
    void RenderFrame();
    void Cleanup();
};

}
}
