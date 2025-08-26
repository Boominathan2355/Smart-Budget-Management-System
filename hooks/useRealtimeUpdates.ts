import { useEffect, useCallback } from 'react';
import { websocketService } from '../services/websocket';
import type { WebSocketEventType } from '../services/websocket';

export function useRealtimeUpdates(
  event: WebSocketEventType,
  handler: (data: any) => void,
) {
  useEffect(() => {
    websocketService.subscribe(event, handler);
    
    return () => {
      websocketService.unsubscribe(event, handler);
    };
  }, [event, handler]);

  const sendUpdate = useCallback((data: any) => {
    websocketService.send(event, data);
  }, [event]);

  return { sendUpdate };
}
