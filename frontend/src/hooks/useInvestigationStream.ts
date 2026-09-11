import { useState, useEffect, useCallback, useRef } from 'react';

export interface SSEEventPayload {
  event: 'TX_INCLUDED' | 'GRAPH_UPDATED' | 'RISK_EVALUATED' | 'SURVEILLANCE_ADDED' | 'NCRP_COMPLAINT_INGESTED' | 'HISTORICAL_BACKFILL_STARTED' | 'HISTORICAL_BACKFILL_COMPLETED';
  data: any;
  timestamp: number;
}

export interface UseInvestigationStreamOptions {
  onTxIncluded?: (data: any) => void;
  onGraphUpdated?: (data: any) => void;
  onRiskEvaluated?: (data: any) => void;
  onSurveillanceAdded?: (data: any) => void;
  onNCRPComplaint?: (data: any) => void;
  onHistoricalBackfillStarted?: (data: any) => void;
  onHistoricalBackfillCompleted?: (data: any) => void;
  apiUrl?: string;
}

export function useInvestigationStream(options: UseInvestigationStreamOptions = {}) {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [events, setEvents] = useState<SSEEventPayload[]>([]);
  const [latestRiskReport, setLatestRiskReport] = useState<any>(null);

    const apiKey = import.meta.env.VITE_API_KEY || 'demo-key-2026';
    const defaultApiUrl = typeof window !== 'undefined' && window.location.port === '5173'
      ? `http://localhost:8000/api/v1/stream/events?api_key=${apiKey}`
      : `/api/v1/stream/events?api_key=${apiKey}`;

    const {
      onTxIncluded,
      onGraphUpdated,
      onRiskEvaluated,
      onSurveillanceAdded,
      onNCRPComplaint,
      onHistoricalBackfillStarted,
      onHistoricalBackfillCompleted,
      apiUrl = defaultApiUrl
    } = options;

  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useEffect(() => {
    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource(apiUrl);

      eventSource.onopen = () => {
        setIsConnected(true);
        console.log('[SSE] Connected to forensic event stream:', apiUrl);
      };

      eventSource.onerror = (err) => {
        setIsConnected(false);
        console.warn('[SSE] Connection error/disconnected from stream:', err);
      };

      const handleMessage = (event_type: SSEEventPayload['event'], rawData: string) => {
        const t6_ms = performance.now();
        try {
          const parsedData = JSON.parse(rawData);
          
          if (parsedData) {
            parsedData._t6_ms = t6_ms;
          }

          const eventEnvelope: SSEEventPayload = {
            event: event_type,
            data: parsedData,
            timestamp: Date.now()
          };

          setEvents((prev) => [eventEnvelope, ...prev].slice(0, 100));

          const { onTxIncluded, onGraphUpdated, onRiskEvaluated, onSurveillanceAdded, onNCRPComplaint } = optionsRef.current;

          if (event_type === 'TX_INCLUDED' && onTxIncluded) {
            onTxIncluded(parsedData);
          } else if (event_type === 'GRAPH_UPDATED' && onGraphUpdated) {
            onGraphUpdated(parsedData);
          } else if (event_type === 'RISK_EVALUATED') {
            setLatestRiskReport(parsedData);
            if (onRiskEvaluated) onRiskEvaluated(parsedData);
          } else if (event_type === 'SURVEILLANCE_ADDED' && onSurveillanceAdded) {
            onSurveillanceAdded(parsedData);
          } else if (event_type === 'NCRP_COMPLAINT_INGESTED' && onNCRPComplaint) {
            onNCRPComplaint(parsedData);
          } else if (event_type === 'HISTORICAL_BACKFILL_STARTED' && optionsRef.current.onHistoricalBackfillStarted) {
            optionsRef.current.onHistoricalBackfillStarted(parsedData);
          } else if (event_type === 'HISTORICAL_BACKFILL_COMPLETED' && optionsRef.current.onHistoricalBackfillCompleted) {
            optionsRef.current.onHistoricalBackfillCompleted(parsedData);
          }
        } catch (e) {
          console.error('[SSE] Failed to parse event payload:', e);
        }
      };

      eventSource.addEventListener('TX_INCLUDED', (e: MessageEvent) => handleMessage('TX_INCLUDED', e.data));
      eventSource.addEventListener('GRAPH_UPDATED', (e: MessageEvent) => handleMessage('GRAPH_UPDATED', e.data));
      eventSource.addEventListener('RISK_EVALUATED', (e: MessageEvent) => handleMessage('RISK_EVALUATED', e.data));
      eventSource.addEventListener('SURVEILLANCE_ADDED', (e: MessageEvent) => handleMessage('SURVEILLANCE_ADDED', e.data));
      eventSource.addEventListener('NCRP_COMPLAINT_INGESTED', (e: MessageEvent) => handleMessage('NCRP_COMPLAINT_INGESTED', e.data));
      eventSource.addEventListener('HISTORICAL_BACKFILL_STARTED', (e: MessageEvent) => handleMessage('HISTORICAL_BACKFILL_STARTED', e.data));
      eventSource.addEventListener('HISTORICAL_BACKFILL_COMPLETED', (e: MessageEvent) => handleMessage('HISTORICAL_BACKFILL_COMPLETED', e.data));

    } catch (exc) {
      console.error('[SSE] Failed to initialize EventSource:', exc);
    }

    return () => {
      if (eventSource) {
        console.log('[SSE] Closing EventSource connection.');
        eventSource.close();
      }
    };
  }, [apiUrl]);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  return {
    isConnected,
    events,
    latestRiskReport,
    clearEvents
  };
}
