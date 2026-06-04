#pragma once

namespace p2pc {
namespace client {

class PeerConnection {
public:
    PeerConnection();
    ~PeerConnection();

    bool Initialize();
    void Connect();
    void Cleanup();
};

}
}
