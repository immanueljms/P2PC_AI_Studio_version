#pragma once

namespace p2pc {
namespace host {

class NVENCEncoder {
public:
    NVENCEncoder();
    ~NVENCEncoder();

    bool Initialize();
    void EncodeFrame();
    void Cleanup();
};

}
}
