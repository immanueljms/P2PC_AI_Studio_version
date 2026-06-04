#include "peer_connection.h"

namespace p2pc {
namespace host {

PeerConnection::PeerConnection() {}
PeerConnection::~PeerConnection() { Cleanup(); }

bool PeerConnection::Initialize() { return true; }
void PeerConnection::Connect() {}
void PeerConnection::Cleanup() {}

}
}
