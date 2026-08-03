import React from 'react';

export default function ChatBubble({ message, isUser, timestamp }) {
  return (
    <div className={`flex w-full mb-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div 
        className={`max-w-[85%] md:max-w-[75%] px-4 py-3 font-body shadow-soft ${
          isUser 
            ? 'gradient-accent text-white rounded-2xl rounded-br-sm' 
            : 'bg-white text-text-primary border border-surface-light rounded-2xl rounded-bl-sm'
        }`}
      >
        <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap break-words">{message}</p>
        {timestamp && (
          <span className={`text-[10px] mt-1 block ${isUser ? 'text-white/80' : 'text-text-muted'}`}>
            {timestamp}
          </span>
        )}
      </div>
    </div>
  );
}
