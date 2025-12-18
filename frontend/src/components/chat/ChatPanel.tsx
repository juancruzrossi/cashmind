'use client';

import { useRef, useEffect, useCallback } from 'react';
import { X, RotateCcw, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChat } from '@/hooks/useChat';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ChatQuickActions } from './ChatQuickActions';
import { ChatConfirmation } from './ChatConfirmation';

interface ChatPanelProps {
  onClose: () => void;
}

export function ChatPanel({ onClose }: ChatPanelProps) {
  const {
    messages,
    currentFlow,
    pendingAction,
    isProcessing,
    sendMessage,
    analyzeImage,
    confirmAction,
    cancelAction,
    selectQuickAction,
    resetChat,
  } = useChat();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, pendingAction, scrollToBottom]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(255,255,255,0.08)] bg-[#0f0f12]">
        <div className="flex items-center gap-3">
          <div
            className="size-9 rounded-full bg-gradient-to-r from-primary to-chart-2
                        flex items-center justify-center"
          >
            <Bot className="size-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-sm text-foreground">Asistente CashMind</h2>
            <p className="text-xs text-muted-foreground">
              {isProcessing ? 'Escribiendo...' : 'En línea'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-foreground"
            onClick={resetChat}
            title="Nueva conversación"
          >
            <RotateCcw className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        className="flex-1 min-h-0 overflow-y-auto px-4 py-3"
      >
        <div className="space-y-3">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}

          {/* Quick Actions */}
          {!currentFlow && !pendingAction && messages.length <= 2 && (
            <ChatQuickActions onSelect={selectQuickAction} />
          )}

          {/* Confirmation */}
          {pendingAction && (
            <ChatConfirmation
              action={pendingAction}
              onConfirm={confirmAction}
              onCancel={cancelAction}
              isLoading={isProcessing}
            />
          )}

          <div ref={messagesEndRef} className="h-1" />
        </div>
      </div>

      {/* Input */}
      <ChatInput
        onSendMessage={sendMessage}
        onSendImage={analyzeImage}
        disabled={isProcessing || !!pendingAction}
        placeholder={
          pendingAction
            ? 'Confirmá o cancelá la operación...'
            : currentFlow
              ? 'Escribí los detalles...'
              : 'Escribí un mensaje...'
        }
      />
    </div>
  );
}
