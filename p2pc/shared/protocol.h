#pragma once
#include <string>

namespace p2pc {
namespace protocol {

enum class MessageType {
    InputKeyboard,
    InputMouse,
    InputGamepad
};

struct DataMessage {
    MessageType type;
    std::string payload;
};

} // namespace protocol
} // namespace p2pc
