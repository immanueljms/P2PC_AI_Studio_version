#pragma once

namespace p2pc {
namespace client {

class InputHandler {
public:
    InputHandler();
    ~InputHandler();

    bool Initialize();
    void HandleInput();
    void Cleanup();
};

}
}
