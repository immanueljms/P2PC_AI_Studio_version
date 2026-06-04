import { useEffect, useRef, useState, useCallback } from 'react';

export interface RemoteInputEvent {
  type: 'keydown' | 'keyup' | 'mousedown' | 'mouseup' | 'mousemove' | 'wheel';
  key?: string;
  code?: string;
  button?: number;
  xRatio?: number; // 0.0 to 1.0 relative horizontal coordinate
  yRatio?: number; // 0.0 to 1.0 relative vertical coordinate
  deltaX?: number;
  deltaY?: number;
  timestamp: number;
}

export function useRemoteControl(role: 'host' | 'player', wsSendMessage?: (payload: any) => void) {
  const [dataChannelStatus, setDataChannelStatus] = useState<'disabled' | 'connecting' | 'open' | 'closed'>('disabled');
  const [remoteEventsLog, setRemoteEventsLog] = useState<RemoteInputEvent[]>([]);
  const [activeKeys, setActiveKeys] = useState<Record<string, boolean>>({});
  
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const targetElementRef = useRef<HTMLElement | null>(null);

  // Handles incoming message from the peer (DataChannel/WebSocket fallback)
  const processIncomingMessage = useCallback((messageData: string | RemoteInputEvent) => {
    try {
      const event: RemoteInputEvent = typeof messageData === 'string' ? JSON.parse(messageData) : messageData;
      setRemoteEventsLog((prev) => [event, ...prev].slice(0, 10));

      if (event.type === 'keydown' && event.code) {
        setActiveKeys((prev) => ({ ...prev, [event.code!]: true }));
      } else if (event.type === 'keyup' && event.code) {
        setActiveKeys((prev) => {
          const updated = { ...prev };
          delete updated[event.code!];
          return updated;
        });
      }
    } catch (err) {
      console.error('Error parsing DataChannel remote event:', err);
    }
  }, []);

  // Set up data channel on a given peer connection
  const setupDataChannel = useCallback((pc: RTCPeerConnection) => {
    if (role === 'host') {
      // Host plays the offerer role and creates the control channel
      console.log('RTC: Host creating control DataChannel.');
      const channel = pc.createDataChannel('p2pc-control', {
        ordered: true // Keep ordered for accurate remote controls
      });
      bindChannelEvents(channel);
    } else {
      // Player acts as the receiver and waits for the channel
      console.log('RTC: Player listening for control DataChannel.');
      pc.ondatachannel = (event) => {
        console.log('RTC: Player received remote DataChannel.');
        bindChannelEvents(event.channel);
      };
    }
  }, [role, processIncomingMessage]);

  const bindChannelEvents = (channel: RTCDataChannel) => {
    dataChannelRef.current = channel;
    setDataChannelStatus('connecting');

    channel.onopen = () => {
      console.log('RTC DataChannel is now OPEN.');
      setDataChannelStatus('open');
    };

    channel.onclose = () => {
      console.log('RTC DataChannel closed.');
      setDataChannelStatus('closed');
      dataChannelRef.current = null;
    };

    channel.onerror = (err) => {
      console.error('RTC DataChannel encountered an error:', err);
      setDataChannelStatus('closed');
    };

    channel.onmessage = (event) => {
      processIncomingMessage(event.data);
    };
  };

  // Safe sender function (uses Peer DataChannel if open, fallback to signaling WS if provided)
  const sendInputEvent = useCallback((event: Omit<RemoteInputEvent, 'timestamp'>) => {
    const fullEvent: RemoteInputEvent = {
      ...event,
      timestamp: Date.now()
    };

    const payloadStr = JSON.stringify(fullEvent);
    let sentViaRTC = false;

    if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
      try {
        dataChannelRef.current.send(payloadStr);
        sentViaRTC = true;
      } catch (err) {
        console.warn('Failed to send event via RTC DataChannel:', err);
      }
    }

    // Fallback to WebSocket multiplexer if data channel isn't ready
    if (!sentViaRTC && wsSendMessage) {
      wsSendMessage(fullEvent);
    }

    // Keep active keys in local sync if player is active
    if (role === 'player') {
      if (fullEvent.type === 'keydown' && fullEvent.code) {
        setActiveKeys((prev) => ({ ...prev, [fullEvent.code!]: true }));
      } else if (fullEvent.type === 'keyup' && fullEvent.code) {
        setActiveKeys((prev) => {
          const updated = { ...prev };
          delete updated[fullEvent.code!];
          return updated;
        });
      }
    }
  }, [wsSendMessage, role]);

  // Handle capture listener callbacks for Mouse & Keyboard
  const lastMouseUpdate = useRef<number>(0);

  const getElementCoordinates = useCallback((e: MouseEvent | WheelEvent, element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const xRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const yRatio = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    return { xRatio, yRatio };
  }, []);

  const handleKeyboardEvent = useCallback((e: KeyboardEvent) => {
    if (role !== 'player') return;

    // Direct game controls override default viewport scrolling
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
      e.preventDefault();
    }

    if (e.type === 'keydown' && e.repeat) return; // avoid key repeats

    sendInputEvent({
      type: e.type as 'keydown' | 'keyup',
      key: e.key.toUpperCase(),
      code: e.code
    });
  }, [role, sendInputEvent]);

  const handleMouseEvent = useCallback((e: MouseEvent) => {
    if (role !== 'player' || !targetElementRef.current) return;

    const { xRatio, yRatio } = getElementCoordinates(e, targetElementRef.current);

    if (e.type === 'mousemove') {
      // Throttle high-frequency movements (approx 60hz limit) to avoid buffer overflow
      const now = Date.now();
      if (now - lastMouseUpdate.current < 16) return;
      lastMouseUpdate.current = now;
    }

    sendInputEvent({
      type: e.type as 'mousedown' | 'mouseup' | 'mousemove',
      button: e.button,
      xRatio: parseFloat(xRatio.toFixed(4)),
      yRatio: parseFloat(yRatio.toFixed(4))
    });
  }, [role, sendInputEvent, getElementCoordinates]);

  const handleWheelEvent = useCallback((e: WheelEvent) => {
    if (role !== 'player' || !targetElementRef.current) return;
    
    e.preventDefault(); // prevent viewport scrolling during captures
    const { xRatio, yRatio } = getElementCoordinates(e, targetElementRef.current);

    sendInputEvent({
      type: 'wheel',
      xRatio: parseFloat(xRatio.toFixed(4)),
      yRatio: parseFloat(yRatio.toFixed(4)),
      deltaX: Math.sign(e.deltaX),
      deltaY: Math.sign(e.deltaY)
    });
  }, [role, sendInputEvent, getElementCoordinates]);

  const bindInputListeners = useCallback((element: HTMLElement | null) => {
    if (role !== 'player') return;

    // Unbind prior elements if exists
    if (targetElementRef.current) {
      const prior = targetElementRef.current;
      prior.removeEventListener('keydown', handleKeyboardEvent);
      prior.removeEventListener('keyup', handleKeyboardEvent);
      prior.removeEventListener('mousedown', handleMouseEvent);
      prior.removeEventListener('mouseup', handleMouseEvent);
      prior.removeEventListener('mousemove', handleMouseEvent);
      prior.removeEventListener('wheel', handleWheelEvent);
    }

    targetElementRef.current = element;

    if (element) {
      console.log('useRemoteControl: Binding keyboard & mouse handlers into interactive element viewport.');
      element.addEventListener('keydown', handleKeyboardEvent);
      element.addEventListener('keyup', handleKeyboardEvent);
      element.addEventListener('mousedown', handleMouseEvent);
      element.addEventListener('mouseup', handleMouseEvent);
      element.addEventListener('mousemove', handleMouseEvent);
      element.addEventListener('wheel', handleWheelEvent);
    }
  }, [role, handleKeyboardEvent, handleMouseEvent, handleWheelEvent]);

  // Clean listener cleanup on unmount
  useEffect(() => {
    return () => {
      if (targetElementRef.current) {
        const prior = targetElementRef.current;
        prior.removeEventListener('keydown', handleKeyboardEvent);
        prior.removeEventListener('keyup', handleKeyboardEvent);
        prior.removeEventListener('mousedown', handleMouseEvent);
        prior.removeEventListener('mouseup', handleMouseEvent);
        prior.removeEventListener('mousemove', handleMouseEvent);
        prior.removeEventListener('wheel', handleWheelEvent);
      }
    };
  }, [handleKeyboardEvent, handleMouseEvent, handleWheelEvent]);

  return {
    dataChannelStatus,
    activeKeys,
    remoteEventsLog,
    setupDataChannel,
    bindInputListeners,
    sendInputEvent,
    processIncomingMessage
  };
}
