'use client';

import { useRef, useEffect, useState, KeyboardEvent } from 'react';
import {
  BotMessageSquare, Send, Trash2, AlertTriangle,
  Copy, Check, ChevronRight, User, Square, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCopilotDrawer } from '@/context/copilot-context';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/types';

// ── Constants ─────────────────────────────────────────────────────────────────

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Hi! I'm SmartRetail Copilot. I can answer questions about your store's sales, inventory, and performance using your live data. What would you like to know?",
  timestamp: new Date(),
};

const SUGGESTIONS = [
  "Today's sales summary",
  'Which products need restock?',
  'Best selling products',
  'Profit overview',
  "What's today's revenue?",
  "What's my best-selling product this month?",
  'How does this month compare to last month?',
  "What's my average order value?",
];

// ── Sub-components ────────────────────────────────────────────────────────────

function TypingCursor() {
  return (
    <span className="inline-flex items-center gap-0.5 ml-0.5 align-middle">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="h-1.5 w-1.5 rounded-full bg-current opacity-60 animate-bounce"
          style={{ animationDelay: `${delay}ms`, animationDuration: '1s' }}
        />
      ))}
    </span>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const copy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn('group flex gap-3 px-1', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full mt-0.5',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted border'
        )}
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : (
          <BotMessageSquare className="h-4 w-4 text-primary" />
        )}
      </div>

      <div className={cn('flex flex-col gap-1 max-w-[76%]', isUser ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'relative rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm',
            isUser
              ? 'bg-primary text-primary-foreground rounded-tr-sm'
              : message.error
              ? 'bg-destructive/10 text-destructive border border-destructive/20 rounded-tl-sm'
              : 'bg-card border rounded-tl-sm'
          )}
        >
          <span className="whitespace-pre-wrap break-words">{message.content}</span>
          {message.streaming && <TypingCursor />}

          {!isUser && !message.streaming && !message.error && message.content && (
            <button
              onClick={copy}
              className={cn(
                'absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity',
                'flex h-6 w-6 items-center justify-center rounded-full bg-background border shadow-sm',
                'text-muted-foreground hover:text-foreground'
              )}
            >
              {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
            </button>
          )}
        </div>

        <span className="text-[10px] text-muted-foreground px-1">
          {message.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}

function WelcomeState({ onSuggestion }: { onSuggestion: (q: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-8 px-4">
      <div className="relative mb-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20">
          <BotMessageSquare className="h-8 w-8 text-primary" />
        </div>
        <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500/50" />
          <span className="relative h-3.5 w-3.5 rounded-full bg-green-500 ring-2 ring-background" />
        </span>
      </div>

      <h2 className="text-xl font-bold tracking-tight">SmartRetail Copilot</h2>
      <p className="text-sm text-muted-foreground mt-1.5 text-center max-w-sm leading-relaxed">
        Ask anything about your store — sales, inventory, trends, or what to do next.
      </p>

      <div className="mt-8 w-full max-w-2xl">
        <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-3 text-center">
          Suggested questions
        </p>
        <div className="grid sm:grid-cols-2 gap-2">
          {SUGGESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => onSuggestion(q)}
              className="flex items-center gap-2.5 rounded-xl border bg-card px-4 py-3 text-sm text-left hover:bg-accent hover:border-primary/30 transition-colors group"
            >
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
              <span className="truncate">{q}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CopilotPage() {
  const { user } = useAuthStore();
  const {
    messages, isStreaming, apiError, setApiError,
    sendMessage, stopGeneration, clearChat,
  } = useCopilotDrawer();

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: isStreaming ? 'auto' : 'smooth', block: 'end' });
  }, [messages, isStreaming]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    sendMessage(input);
    setInput('');
    if (inputRef.current) inputRef.current.style.height = '44px';
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  const showWelcomeUI = messages.length === 0;

  return (
    <div className="flex flex-col -m-6 h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 px-6 py-3.5 border-b bg-card shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
              <BotMessageSquare className="h-[18px] w-[18px] text-primary" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-card" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-sm tracking-tight">SmartRetail Copilot</h1>
              <Badge variant="success" className="text-[9px] gap-1 px-1.5 h-[18px]">
                <span className="h-1.5 w-1.5 rounded-full bg-green-600 inline-block" />
                Live
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {user?.store?.name ?? 'All stores'} · Powered by Gemini
            </p>
          </div>
        </div>

        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={clearChat}
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline text-xs">Clear</span>
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {showWelcomeUI ? (
          <WelcomeState onSuggestion={(q) => sendMessage(q)} />
        ) : (
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
            <MessageBubble key="welcome" message={WELCOME_MESSAGE} />
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Error banner */}
      {apiError && (
        <div className="mx-4 mb-2 flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-xs text-destructive shrink-0">
          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>{apiError}</span>
          <button
            onClick={() => setApiError(null)}
            className="ml-auto shrink-0 opacity-60 hover:opacity-100"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Input */}
      <div className="shrink-0 border-t bg-card px-4 py-4">
        <div className="max-w-3xl mx-auto">
          {messages.length > 0 && !isStreaming && !input && (
            <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-none">
              {SUGGESTIONS.slice(0, 4).map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="whitespace-nowrap text-xs rounded-full border bg-muted/60 px-3 py-1.5 hover:bg-accent hover:border-primary/30 transition-colors shrink-0"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about your store…"
                rows={1}
                disabled={isStreaming}
                className={cn(
                  'w-full resize-none rounded-xl border bg-background px-4 py-3 text-sm',
                  'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30',
                  'min-h-[44px] max-h-[120px] overflow-y-auto leading-relaxed',
                  'disabled:opacity-50 transition-shadow'
                )}
                style={{ height: '44px' }}
              />
            </div>

            {isStreaming ? (
              <Button
                size="sm"
                variant="outline"
                onClick={stopGeneration}
                className="h-11 w-11 rounded-xl shrink-0 border-destructive/40 text-destructive hover:bg-destructive/5"
              >
                <Square className="h-3.5 w-3.5 fill-current" />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleSend}
                disabled={!input.trim()}
                className="h-11 w-11 rounded-xl shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>

          <p className="text-[10px] text-muted-foreground mt-2 text-center">
            Press <kbd className="rounded border px-1 py-px text-[9px] font-mono">Enter</kbd> to send ·{' '}
            <kbd className="rounded border px-1 py-px text-[9px] font-mono">Shift+Enter</kbd> for new line
          </p>
        </div>
      </div>
    </div>
  );
}
