'use client';

import { Bot, User } from 'lucide-react';
import type { ChatMessage as ChatMessageType } from '@/lib/chat/types';

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className={`size-7 rounded-full flex-shrink-0 flex items-center justify-center
                    ${isUser
                      ? 'bg-primary/20'
                      : 'bg-gradient-to-r from-primary to-chart-2'
                    }`}
      >
        {isUser ? (
          <User className="size-4 text-primary" />
        ) : (
          <Bot className="size-4 text-white" />
        )}
      </div>

      {/* Content */}
      <div
        className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm
                    ${isUser
                      ? 'bg-primary text-primary-foreground rounded-tr-sm'
                      : 'bg-[#1a1a1f] text-foreground rounded-tl-sm'
                    }`}
      >
        {message.imageUrl && (
          <img
            src={message.imageUrl}
            alt="Imagen adjunta"
            className="max-w-full rounded-lg mb-2"
          />
        )}
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
}
