'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { Send, ImagePlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onSendImage: (file: File) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSendMessage,
  onSendImage,
  disabled = false,
  placeholder = 'Escribí un mensaje...',
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSendImage(file);
      e.target.value = '';
    }
  };

  return (
    <div className="px-4 py-3 border-t border-[rgba(255,255,255,0.08)] bg-[#0f0f12]">
      <div className="flex items-center gap-2">
        {/* Image Upload */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-9 text-muted-foreground hover:text-foreground flex-shrink-0"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          title="Subir imagen"
        >
          <ImagePlus className="size-5" />
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Text Input */}
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 bg-[#1a1a1f] border border-[rgba(255,255,255,0.08)] rounded-full
                     px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground
                     focus:outline-none focus:ring-2 focus:ring-primary/50
                     disabled:opacity-50 disabled:cursor-not-allowed"
        />

        {/* Send Button */}
        <Button
          type="button"
          size="icon"
          className="size-9 rounded-full bg-gradient-to-r from-primary to-chart-2
                     hover:from-primary/90 hover:to-chart-2/90 flex-shrink-0"
          onClick={handleSend}
          disabled={disabled || !message.trim()}
        >
          {disabled ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
