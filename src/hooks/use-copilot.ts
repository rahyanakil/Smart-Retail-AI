'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import type { ChatMessage } from '@/types';

// ── Constants ─────────────────────────────────────────────────────────────────

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000').replace(/\/$/, '');
const STORAGE_KEY = 'smartretail-copilot-history';
const MAX_HISTORY = 40;

// ── Helpers ───────────────────────────────────────────────────────────────────

function nanoid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function serializeMessages(messages: ChatMessage[]): string {
  return JSON.stringify(
    messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      error: m.error,
      timestamp: m.timestamp.toISOString(),
    }))
  );
}

function deserializeMessages(raw: string): ChatMessage[] {
  try {
    const arr = JSON.parse(raw) as Array<{
      id: string;
      role: 'user' | 'assistant';
      content: string;
      error?: boolean;
      timestamp: string;
    }>;
    return arr.map((m) => ({ ...m, timestamp: new Date(m.timestamp) }));
  } catch {
    return [];
  }
}

export function useCopilot() {
  const { accessToken } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  // ── Persistence ─────────────────────────────────────────────────────────────

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = deserializeMessages(raw);
        if (saved.length) setMessages(saved);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (messages.length === 0) return;
    try {
      const complete = messages.filter((m) => !m.streaming);
      sessionStorage.setItem(STORAGE_KEY, serializeMessages(complete.slice(-MAX_HISTORY)));
    } catch {}
  }, [messages]);

  // ── Logic ───────────────────────────────────────────────────────────────────

  const getHistoryForApi = useCallback((currentMessages: ChatMessage[]) => {
    return currentMessages
      .filter((m) => !m.streaming && !m.error && m.id !== 'welcome')
      .slice(-20)
      .map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        content: m.content,
      }));
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;

      setApiError(null);

      const userMsg: ChatMessage = {
        id: nanoid(),
        role: 'user',
        content: trimmed,
        timestamp: new Date(),
      };

      const aiMsgId = nanoid();
      const aiPlaceholder: ChatMessage = {
        id: aiMsgId,
        role: 'assistant',
        content: '',
        streaming: true,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg, aiPlaceholder]);
      setIsStreaming(true);

      const historySnapshot = getHistoryForApi(
        messages.filter((m) => m.id !== 'welcome')
      );

      const abort = new AbortController();
      abortRef.current = abort;

      try {
        const response = await fetch(`${API_BASE}/api/chat/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken ?? ''}`,
          },
          body: JSON.stringify({ message: trimmed, history: historySnapshot }),
          signal: abort.signal,
        });

        if (!response.ok) {
          let errMsg = `Server error (${response.status})`;
          try {
            const body = await response.json() as { message?: string };
            if (body.message) errMsg = body.message;
          } catch {}
          throw new Error(errMsg);
        }

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (line.startsWith('event: error')) continue;

            if (line.startsWith('data: ')) {
              const payload = line.slice(6).trim();

              if (payload === '[DONE]') {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === aiMsgId ? { ...m, streaming: false } : m
                  )
                );
                setIsStreaming(false);
                return;
              }

              try {
                const parsed = JSON.parse(payload) as { text?: string; message?: string };
                if (parsed.message) throw new Error(parsed.message);
                if (parsed.text) {
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === aiMsgId
                        ? { ...m, content: m.content + parsed.text }
                        : m
                    )
                  );
                }
              } catch (parseErr) {
                if (parseErr instanceof SyntaxError) continue;
                throw parseErr;
              }
            }
          }
        }

        setMessages((prev) =>
          prev.map((m) => (m.id === aiMsgId ? { ...m, streaming: false } : m))
        );
      } catch (err: unknown) {
        if ((err as { name?: string }).name === 'AbortError') {
          setMessages((prev) => prev.filter((m) => m.id !== aiMsgId));
        } else {
          const errMsg = err instanceof Error ? err.message : 'Failed to connect to the AI service';
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiMsgId
                ? { ...m, content: errMsg, streaming: false, error: true }
                : m
            )
          );
          setApiError(errMsg);
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [isStreaming, messages, accessToken, getHistoryForApi]
  );

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const clearChat = useCallback(() => {
    stopGeneration();
    setMessages([]);
    setApiError(null);
    try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
  }, [stopGeneration]);

  return {
    messages,
    isStreaming,
    apiError,
    sendMessage,
    stopGeneration,
    clearChat,
  };
}
