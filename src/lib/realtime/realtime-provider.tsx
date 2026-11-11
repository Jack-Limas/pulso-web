"use client";

import { createContext, type ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";

export type RealtimeEvent =
  | { type: "statement.status"; statementId: string; status: string; failureReason?: string }
  | { type: "statement.stage"; statementId: string; stage: string }
  | { type: "transaction.updated"; transactionId: string }
  | { type: "announcement"; title: string; body: string };

type Listener = (event: RealtimeEvent) => void;

interface RealtimeValue {
  connected: boolean;
  subscribe(listener: Listener): () => void;
}

const RealtimeContext = createContext<RealtimeValue | null>(null);
const MAX_BACKOFF_MS = 30_000;

async function fetchSocketToken(): Promise<string | null> {
  const response = await fetch("/api/auth/socket-token", { cache: "no-store" });
  return response.ok ? ((await response.json()) as { token: string }).token : null;
}

/** One socket per tab, shared by every component through subscribe(). */
export function RealtimeProvider({ url, children }: { url: string; children: ReactNode }) {
  const listeners = useRef(new Set<Listener>());
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let socket: WebSocket | undefined;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let attempt = 0;
    let stopped = false;

    async function connect() {
      const token = await fetchSocketToken().catch(() => null);
      if (stopped) {
        return;
      }
      if (!token) {
        scheduleReconnect();
        return;
      }
      socket = new WebSocket(url);
      socket.onopen = () => socket?.send(JSON.stringify({ type: "auth", token }));
      socket.onmessage = ({ data }) => {
        const message = JSON.parse(String(data)) as RealtimeEvent | { type: "ready" };
        if (message.type === "ready") {
          attempt = 0;
          setConnected(true);
          return;
        }
        listeners.current.forEach((listener) => listener(message));
      };
      socket.onclose = () => {
        setConnected(false);
        scheduleReconnect();
      };
    }

    // Exponential backoff with jitter, so a restarted server is not flooded by every tab at once.
    function scheduleReconnect() {
      if (stopped) {
        return;
      }
      const delay = Math.min(MAX_BACKOFF_MS, 1000 * 2 ** attempt++) * (0.5 + Math.random() / 2);
      retry = setTimeout(connect, delay);
    }

    void connect();
    return () => {
      stopped = true;
      clearTimeout(retry);
      socket?.close();
    };
  }, [url]);

  const subscribe = useCallback((listener: Listener) => {
    listeners.current.add(listener);
    return () => {
      listeners.current.delete(listener);
    };
  }, []);

  return <RealtimeContext.Provider value={{ connected, subscribe }}>{children}</RealtimeContext.Provider>;
}

export function useRealtime(listener?: Listener): boolean {
  const value = useContext(RealtimeContext);
  if (!value) {
    throw new Error("useRealtime must be used inside RealtimeProvider");
  }
  const latest = useRef(listener);
  useEffect(() => {
    latest.current = listener;
  });
  const { subscribe } = value;
  useEffect(() => subscribe((event) => latest.current?.(event)), [subscribe]);
  return value.connected;
}
