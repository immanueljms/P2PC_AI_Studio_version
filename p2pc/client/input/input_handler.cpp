#include "input_handler.h"

namespace p2pc {
namespace client {

InputHandler::InputHandler() {}
InputHandler::~InputHandler() { Cleanup(); }

bool InputHandler::Initialize() { return true; }
void InputHandler::HandleInput() {}
void InputHandler::Cleanup() {}

}
}
