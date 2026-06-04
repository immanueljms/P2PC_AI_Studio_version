add_executable(p2pc_host
    main.cpp
    ui/main_window.cpp
    capture/dxgi_capture.cpp
    encode/nvenc_encoder.cpp
    webrtc/peer_connection.cpp
)

target_include_directories(p2pc_host PRIVATE 
    ${CMAKE_CURRENT_SOURCE_DIR}
    ${CMAKE_CURRENT_SOURCE_DIR}/../shared
)

target_link_libraries(p2pc_host PRIVATE Qt6::Widgets FFmpeg::FFmpeg)
set_target_properties(p2pc_host PROPERTIES AUTOMOC ON AUTOUIC ON AUTORCC ON)
