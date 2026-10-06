"use client";

import { useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import { usePresentationState } from "@/states/presentation-state";
import type { PlateSlide } from "@/components/presentation/utils/parser";

export function usePresentationCollaboration(artifactId: string) {
  const slides = usePresentationState((state) => state.slides);
  const setSlides = usePresentationState((state) => state.setSlides);
  const [status, setStatus] = useState<"disabled" | "connecting" | "connected" | "offline">("disabled");
  const roomRef = useRef<Y.Map<string> | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const lastRemoteJson = useRef<string | null>(null);

  useEffect(() => {
    if (!artifactId) return;
    let disposed = false;
    const doc = new Y.Doc();
    const room = doc.getMap<string>("artifact");
    const clientId = crypto.randomUUID();

    const connect = async () => {
      setStatus("connecting");
      const response = await fetch(`/api/collaboration/token?artifactId=${encodeURIComponent(artifactId)}`);
      if (!response.ok) {
        setStatus("offline");
        return;
      }
      const payload = (await response.json()) as { token: string; wsUrl: string | null };
      if (!payload.wsUrl || disposed) {
        setStatus("disabled");
        return;
      }

      const wsUrl = new URL(payload.wsUrl);
      wsUrl.searchParams.set("token", payload.token);
      wsUrl.searchParams.set("clientId", clientId);
      const socket = new WebSocket(wsUrl);
      socket.binaryType = "arraybuffer";
      socketRef.current = socket;
      roomRef.current = room;

      socket.onopen = () => setStatus("connected");
      socket.onclose = () => !disposed && setStatus("offline");
      socket.onerror = () => !disposed && setStatus("offline");
      socket.onmessage = (event) => {
        if (event.data instanceof ArrayBuffer) {
          Y.applyUpdate(doc, new Uint8Array(event.data), "remote");
        }
      };

      doc.on("update", (update, origin) => {
        if (origin !== "remote" && socket.readyState === WebSocket.OPEN) {
          socket.send(update);
        }
      });

      room.observe(() => {
        const value = room.get("slides");
        if (!value) return;
        lastRemoteJson.current = value;
        try {
          setSlides(JSON.parse(value) as PlateSlide[]);
        } catch {
          // Ignore malformed remote snapshots.
        }
      });
    };

    void connect();

    return () => {
      disposed = true;
      socketRef.current?.close();
      doc.destroy();
      roomRef.current = null;
    };
  }, [artifactId, setSlides]);

  useEffect(() => {
    const room = roomRef.current;
    if (!room || status !== "connected") return;
    const json = JSON.stringify(slides);
    if (lastRemoteJson.current === json) {
      lastRemoteJson.current = null;
      return;
    }
    room.set("slides", json);
  }, [slides, status]);

  return { status };
}
