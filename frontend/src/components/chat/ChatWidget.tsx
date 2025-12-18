'use client';

import { useState, useCallback } from 'react';
import { Bot, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatPanel } from './ChatPanel';

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return (
    <>
      {/* Chat Panel */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-4 z-[60] w-[calc(100vw-2rem)] max-w-[380px] h-[min(520px,70vh)]
                     bg-[#0a0a0c] rounded-2xl border border-[rgba(255,255,255,0.08)]
                     shadow-2xl overflow-hidden flex flex-col
                     animate-in fade-in slide-in-from-bottom-4 duration-300
                     sm:right-6 sm:w-[380px]"
        >
          <ChatPanel onClose={handleClose} />
        </div>
      )}

      {/* FAB Button */}
      <Button
        onClick={handleToggle}
        className={`fixed bottom-6 right-4 z-50 size-14 rounded-full shadow-lg
                   transition-all duration-300 hover:scale-105
                   sm:right-6
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
