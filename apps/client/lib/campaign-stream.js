"use client";
import { useEffect, useState } from "react";
import { api } from "./api";

export function useCampaignStream(workspace, id) {
  const [revision, setRevision] = useState(0);
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    if (!id) return;
    let stopped = false;
    let timer;
    let idle;
    let controller;
    let delay = 1000;
    async function connect() {
      controller = new AbortController();
      try {
        const response = await api(`/orgs/${workspace.org.id}/campaigns/${id}/stream`, { token: workspace.token, responseType: "stream", signal: controller.signal });
        if (!response.headers.get("content-type")?.includes("text/event-stream")) throw new Error("Stream unavailable");
        if (stopped) return;
        setConnected(true);
        delay = 1000;
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let pending = "";
        try {
          while (!stopped) {
            clearTimeout(idle);
            idle = setTimeout(() => controller.abort(), 45000);
            const { done, value } = await reader.read();
            if (done) break;
            pending += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");
            let boundary;
            while ((boundary = pending.indexOf("\n\n")) !== -1) {
              const event = pending.slice(0, boundary);
              pending = pending.slice(boundary + 2);
              if (/^event: (snapshot|change)$/m.test(event)) setRevision(value => value + 1);
            }
          }
        } finally { await reader.cancel().catch(() => {}); }
      } catch { /* Existing polling keeps results available during stream outages. */ }
      finally {
        clearTimeout(idle);
        if (!stopped) {
          setConnected(false);
          timer = setTimeout(connect, delay);
          delay = Math.min(delay * 2, 30000);
        }
      }
    }
    connect();
    return () => { stopped = true; clearTimeout(timer); clearTimeout(idle); controller?.abort(); };
  }, [workspace, id]);
  return { revision, connected };
}
