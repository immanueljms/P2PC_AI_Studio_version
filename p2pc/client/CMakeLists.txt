add_executable(p2pc_client
    main.cpp
    ui/main_window.cpp
    render/d3d11_renderer.cpp
    input/input_handler.cpp
    webrtc/peer_connection.cpp
)

target_include_directories(p2pc_client PRIVATE 
    ${CMAKE_CURRENT_SOURCE_DIR}
    ${CMAKE_CURRENT_SOURCE_DIR}/../shared
)

target_link_libraries(p2pc_client PRIVATE Qt6::Widgets)
set_target_properties(p2pc_client PROPERTIES AUTOMOC ON AUTOUIC ON AUTORCC ON)
