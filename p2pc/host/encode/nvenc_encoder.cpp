#include "nvenc_encoder.h"

namespace p2pc {
namespace host {

NVENCEncoder::NVENCEncoder() {}
NVENCEncoder::~NVENCEncoder() { Cleanup(); }

bool NVENCEncoder::Initialize() { return true; }
void NVENCEncoder::EncodeFrame() {}
void NVENCEncoder::Cleanup() {}

}
}
