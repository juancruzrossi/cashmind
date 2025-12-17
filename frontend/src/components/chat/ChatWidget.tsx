'use client';

import { useState } from 'react';
import { Bot, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatPanel } from './ChatPanel';

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Chat Panel */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 z-50 w-[380px] h-[520px]
                     bg-[#0a0a0c] rounded-2xl border border-[rgba(255,255,255,0.08)]
                     shadow-2xl overflow-hidden
                     animate-in fade-in slide-in-from-bottom-4 duration-300"
        >
          <ChatPanel onClose={() => setIsOpen(false)} />
        </div>
      )}

      {/* FAB Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 size-14 rounded-full shadow-lg
                   transition-all duration-300 hover:scale-105
                   ${isOpen
                     ? 'bg-[#1a1a1f] hover:bg-[#252530]'
                     : 'bg-gradient-to-r from-primary to-chart-2 hover:from-primary/90 hover:to-chart-2/90'
                   }`}
        size="icon"
      >
        {isOpen ? (
          <X className="size-6" />
        ) : (
          <Bot className="size-6" />
        )}
      </Button>
    </>
  );
}
