#pragma once

namespace p2pc {
namespace host {

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
