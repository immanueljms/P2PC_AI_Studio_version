#pragma once

#include <string>
#include <functional>

// Forward declarations for libwebrtc types (stubbed for structure)
namespace webrtc {
    class PeerConnectionInterface;
    class PeerConnectionFactoryInterface;
    class DataChannelInterface;
}

class WebRTCManager {
public:
    WebRTCManager();
    ~WebRTCManager();

    bool InitializeFactory();
    bool CreateConnection(bool isHost);
    bool ConnectSignaling(const std::string& wsUrl, const std::string& role, const std::string& id);
    
    // Host: pushing encoded AV packets as RTP
    void SendVideoPacket(const uint8_t* data, size_t length);
    
    // Client: receive input events
    void SetInputCallback(std::function<void(const std::string& datachannel_msg)> callback);

private:
    // Pointers to WebRTC native API objects
    webrtc::PeerConnectionFactoryInterface* m_factory_impl = nullptr;
    webrtc::PeerConnectionInterface* m_peer_connection = nullptr;
    webrtc::DataChannelInterface* m_data_channel = nullptr;
    // ... websockets signaling logic ...
};
