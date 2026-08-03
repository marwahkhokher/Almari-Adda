import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Send, RotateCcw } from 'lucide-react';
import Header from '../components/layout/Header.jsx';
import ChatBubble from '../components/chat/ChatBubble.jsx';
import OutfitCard from '../components/chat/OutfitCard.jsx';
import { sendChatMessage, resetChatSession } from '../lib/api.js';

export default function ChatbotScreen() {
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState('');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const initialMessage = {
    id: 'welcome',
    text: "Hello! I'm your AI Fashion Stylist. Ask me anything about outfits, styling tips, or wardrobe suggestions!",
    isUser: false,
    timestamp: Date.now()
  };

  const [messages, setMessages] = useState([initialMessage]);

  useEffect(() => {
    const sid = crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
    setSessionId(sid);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = {
      id: Date.now().toString(),
      text: input.trim(),
      isUser: true,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await sendChatMessage(sessionId, userMessage.text);
      
      const botMessage = {
        id: (Date.now() + 1).toString(),
        text: response.reply,
        isUser: false,
        outfitSuggestions: response.outfit_suggestions,
        imageUrls: response.image_urls,
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I couldn't reach the stylist engine right now. Please try again in a moment.",
        isUser: false,
        timestamp: Date.now()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReset = async () => {
    try {
      if (sessionId) {
        await resetChatSession(sessionId);
      }
      const newSid = crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
      setSessionId(newSid);
      setMessages([{ ...initialMessage, id: Date.now().toString() }]);
    } catch (e) {
      console.error('Error resetting chat', e);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-primary gradient-pastel">
      <Header 
        title="AI Stylist" 
        showBack={true} 
        rightAction={
          <button 
            onClick={handleReset}
            className="p-2 text-text-secondary hover:text-accent transition-colors rounded-full hover:bg-white/80"
            title="Reset Chat"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        }
      />
      
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 no-scrollbar pb-28">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-2"
          >
            <ChatBubble message={msg.text} isUser={msg.isUser} />
            
            {(!msg.outfitSuggestions || msg.outfitSuggestions.length === 0) && msg.imageUrls && msg.imageUrls.length > 0 && (
              <div className={`flex flex-wrap gap-2 mt-2 ${msg.isUser ? 'justify-end' : 'justify-start ml-2'}`}>
                {msg.imageUrls.map((url, i) => (
                  <img key={i} src={url} alt="Reference" className="w-auto h-36 rounded-2xl object-cover shadow-soft border border-surface-light" />
                ))}
              </div>
            )}
            
            {msg.outfitSuggestions && msg.outfitSuggestions.length > 0 && (
              <div className="mt-2 space-y-3">
                {msg.outfitSuggestions.map((outfit, i) => (
                  <OutfitCard key={i} outfit={outfit} />
                ))}
              </div>
            )}
          </motion.div>
        ))}

        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-2 items-end max-w-[80%]"
          >
            <div className="w-8 h-8 rounded-full gradient-accent text-white flex items-center justify-center flex-shrink-0 font-display font-bold text-xs shadow-soft">
              AI
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-bl-none bg-white border border-surface-light shadow-soft flex items-center gap-1.5 h-[44px]">
              <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-surface-light p-4 shadow-medium">
        <div className="flex items-center gap-3 max-w-3xl mx-auto">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask for outfit ideas, color matches..."
            className="flex-1 max-h-32 min-h-[48px] rounded-2xl bg-secondary/70 px-5 py-3 border border-surface-light focus:ring-2 focus:ring-accent/30 focus:border-accent/40 text-text-primary placeholder:text-text-muted resize-none no-scrollbar text-sm md:text-base font-body"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="rounded-full gradient-accent text-white p-3 h-12 w-12 flex items-center justify-center shrink-0 disabled:opacity-40 shadow-soft hover:scale-105 transition-all"
          >
            <Send className="w-5 h-5 ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
