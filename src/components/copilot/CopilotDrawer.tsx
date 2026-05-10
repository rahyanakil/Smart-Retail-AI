'use client';

import { useRef, useEffect, useState, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BotMessageSquare, Send, Trash2, X, User,
  Copy, Check, AlertTriangle, ChevronRight, Square,
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
];

// ── TypingCursor ──────────────────────────────────────────────────────────────

function TypingCursor() {
  return (
    <span className="inline-flex items-center gap-0.5 ml-1 align-middle">
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

// ── MessageBubble ─────────────────────────────────────────────────────────────

function MessageBubble({
  message,
  animate = false,
}: {
  message: ChatMessage;
  animate?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const copy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 6 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className={cn('group flex gap-2.5', isUser ? 'flex-row-reverse' : 'flex-row')}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full mt-0.5',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted border border-border'
        )}
      >
        {isUser ? (
          <User className="h-3.5 w-3.5" />
        ) : (
          <BotMessageSquare className="h-3.5 w-3.5 text-primary" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          'flex flex-col gap-1 max-w-[82%]',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        <div
          className={cn(
            'relative rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed',
            isUser
              ? 'bg-primary text-primary-foreground rounded-tr-sm'
              : message.error
              ? 'bg-destructive/10 text-destructive border border-destructive/20 rounded-tl-sm'
              : 'bg-card border border-border rounded-tl-sm shadow-sm'
          )}
        >
          <span className="whitespace-pre-wrap break-words">{message.content}</span>
          {message.streaming && <TypingCursor />}

          {!isUser && !message.streaming && !message.error && message.content && (
            <button
              onClick={copy}
              className={cn(
                'absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity',
                'flex h-5 w-5 items-center justify-center rounded-full',
                'bg-background border border-border shadow-sm',
                'text-muted-foreground hover:text-foreground'
              )}
            >
              {copied ? (
                <Check className="h-2.5 w-2.5 text-green-500" />
              ) : (
                <Copy className="h-2.5 w-2.5" />
              )}
            </button>
          )}
        </div>

        <span className="text-[10px] text-muted-foreground px-1">
          {message.timestamp.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </motion.div>
  );
}

// ── WelcomeView ───────────────────────────────────────────────────────────────

function WelcomeView({ onSuggestion }: { onSuggestion: (q: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-5 py-8">
      {/* Icon with ping */}
      <div className="relative mb-5">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 22, delay: 0.05 }}
          className={cn(
            'flex h-14 w-14 items-center justify-center rounded-2xl',
            'bg-gradient-to-br from-primary/20 via-primary/10 to-transparent',
            'border border-primary/20 shadow-lg shadow-primary/5'
          )}
        >
          <BotMessageSquare className="h-7 w-7 text-primary" />
        </motion.div>
        <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center">
          <span className="absolute h-full w-full animate-ping rounded-full bg-green-500/50" />
          <span className="relative h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />
        </span>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-center"
      >
        <h2 className="text-[15px] font-semibold tracking-tight">SmartRetail Copilot</h2>
        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed max-w-[210px] mx-auto">
          Ask anything about your store — sales, inventory, or performance.
        </p>
      </motion.div>

      {/* Suggested prompts */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mt-7 w-full space-y-2"
      >
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-3">
          Quick actions
        </p>
        {SUGGESTIONS.map((q, i) => (
          <motion.button
            key={q}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.18 + i * 0.055 }}
            onClick={() => onSuggestion(q)}
            className={cn(
              'w-full flex items-center gap-3 rounded-xl border border-border bg-card',
              'px-4 py-3 text-left text-[13px] font-medium',
              'hover:bg-accent hover:border-primary/30 hover:shadow-md',
              'active:scale-[0.98] transition-all duration-150',
              'group shadow-sm'
            )}
          >
            <ChevronRight className="h-3 w-3 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
            <span>{q}</span>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}

// ── CopilotDrawer ─────────────────────────────────────────────────────────────

export function CopilotDrawer() {
  const {
    isOpen, close,
    messages, isStreaming, apiError, setApiError,
    sendMessage, stopGeneration, clearChat,
  } = useCopilotDrawer();
  const { user } = useAuthStore();

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const prevMsgCountRef = useRef(0);

  // Auto-scroll on new messages or while streaming
  useEffect(() => {
    if (messages.length > prevMsgCountRef.current || isStreaming) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
    prevMsgCountRef.current = messages.length;
  }, [messages, isStreaming]);

  // Focus input when drawer opens
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 320);
  }, [isOpen]);

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    sendMessage(input);
    setInput('');
    if (inputRef.current) {
      inputRef.current.style.height = '40px';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  const showWelcome = messages.length === 0;

  return (
    <>
      {/* Backdrop — mobile only */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="copilot-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
            className="fixed inset-0 z-[55] bg-black/40 backdrop-blur-[2px] md:hidden"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Drawer — always mounted, slides off-screen when closed */}
      <motion.aside
        aria-label="AI Copilot"
        role="complementary"
        className={cn(
          'fixed inset-y-0 right-0 z-[60] flex w-full flex-col',
          'sm:w-[400px] lg:w-[420px]',
          'bg-background border-l border-border shadow-2xl',
          'will-change-transform'
        )}
        initial={false}
        animate={{ x: isOpen ? 0 : '100%' }}
        transition={{ type: 'spring', stiffness: 360, damping: 36 }}
      >
        {/* Top accent gradient line */}
        <div className="h-[1.5px] w-full bg-gradient-to-r from-transparent via-primary/50 to-transparent shrink-0" />

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3 px-4 py-3.5 border-b border-border bg-card/80 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {/* Icon with live dot */}
            <div className="relative shrink-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
                <BotMessageSquare className="h-[18px] w-[18px] text-primary" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-card" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold leading-none tracking-tight">
                  Copilot
                </span>
                <Badge
                  variant="success"
                  className="text-[9px] gap-1 px-1.5 h-[18px] font-medium"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-green-600 inline-block" />
                  Live
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                {user?.store?.name ?? 'All stores'} · Powered by Gemini
              </p>
            </div>
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
                onClick={clearChat}
                title="Clear conversation"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
              onClick={close}
              title="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* ── Messages ───────────────────────────────────────────────────────── */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {showWelcome ? (
            <WelcomeView onSuggestion={(q) => sendMessage(q)} />
          ) : (
            <div className="px-4 py-5 space-y-4">
              <MessageBubble message={WELCOME_MESSAGE} />
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} animate />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* ── Error Banner ────────────────────────────────────────────────────── */}
        <AnimatePresence>
          {apiError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mx-3 mb-2 shrink-0 overflow-hidden"
            >
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-xs text-destructive">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span className="flex-1 leading-relaxed">{apiError}</span>
                <button
                  onClick={() => setApiError(null)}
                  className="opacity-60 hover:opacity-100 transition-opacity shrink-0 mt-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Input Area ─────────────────────────────────────────────────────── */}
        <div className="shrink-0 border-t border-border bg-card/80 backdrop-blur-sm px-4 pb-4 pt-3">
          {/* Quick suggestion chips — shown after messages when idle */}
          {messages.length > 0 && !isStreaming && !input && (
            <div className="flex gap-1.5 mb-3 overflow-x-auto pb-0.5 scrollbar-none">
              {SUGGESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className={cn(
                    'whitespace-nowrap text-[11px] font-medium rounded-full',
                    'border border-border bg-muted/50 px-3 py-1.5',
                    'hover:bg-accent hover:border-primary/30 transition-colors shrink-0'
                  )}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about your store…"
                rows={1}
                disabled={isStreaming}
                className={cn(
                  'w-full resize-none rounded-xl border border-input bg-background',
                  'px-3.5 py-2.5 text-sm placeholder:text-muted-foreground',
                  'focus:outline-none focus:ring-2 focus:ring-ring/50',
                  'min-h-[40px] max-h-[120px] overflow-y-auto leading-relaxed',
                  'disabled:opacity-50 transition-shadow'
                )}
                style={{ height: '40px' }}
              />
            </div>

            {isStreaming ? (
              <Button
                size="icon"
                variant="outline"
                onClick={stopGeneration}
                title="Stop generation"
                className="h-10 w-10 rounded-xl shrink-0 border-destructive/40 text-destructive hover:bg-destructive/5"
              >
                <Square className="h-3.5 w-3.5 fill-current" />
              </Button>
            ) : (
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!input.trim()}
                title="Send message"
                className="h-10 w-10 rounded-xl shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>

          <p className="text-[10px] text-muted-foreground mt-2 text-center">
            <kbd className="rounded border px-1 py-px text-[9px] font-mono">Enter</kbd> to send ·{' '}
            <kbd className="rounded border px-1 py-px text-[9px] font-mono">Shift+Enter</kbd> new line
          </p>
        </div>
      </motion.aside>
    </>
  );
}
