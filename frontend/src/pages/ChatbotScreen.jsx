import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Send, RotateCcw, ArrowLeft } from 'lucide-react';
import ChatBubble from '../components/chat/ChatBubble.jsx';
import OutfitCard from '../components/chat/OutfitCard.jsx';
import { sendChatMessage, resetChatSession } from '../lib/api.js';

const BG_PATTERN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Cg transform='rotate(-10 100 100)' fill='none' stroke='%23D4537E' stroke-width='2'%3E%3Cpath d='M28 18l-8 6-8-6-8 6v8l8-2v22h16V26l8 2v-8z'/%3E%3Cg transform='translate(90 10)'%3E%3Cpath d='M2 2h26v14l-6 2v50h-6V34l-2 2-2-2v34h-6V18l-6-2z'/%3E%3C/g%3E%3Cg transform='translate(20 100)'%3E%3Cpath d='M2 20c0-10 8-18 18-18s18 8 18 18H2z'/%3E%3Cellipse cx='20' cy='20' rx='24' ry='4'/%3E%3C/g%3E%3Cg transform='translate(110 105)'%3E%3Ccircle cx='8' cy='10' r='8'/%3E%3Ccircle cx='32' cy='10' r='8'/%3E%3Cpath d='M16 10h8M0 8l-6-4M40 8l6-4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")";

export default function ChatbotScreen() {
  const navigate = useNavigate();

  const [sessionId, setSessionId] = useState('');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);

  const initialMessage = {
    id: 'welcome',
    text: "Hi! I'm your AI stylist. Ask me anything about outfits, styling tips, or wardrobe suggestions.",
    isUser: false,
    timestamp: Date.now()
  };

  const [messages, setMessages] = useState([initialMessage]);

  useEffect(() => {
    const sid = crypto?.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2, 15);

    setSessionId(sid);
  }, []);

  /*
   * Scroll to the newest content.
   *
   * The large bottom spacer below the loading indicator means
   * the indicator can be positioned comfortably above the fixed
   * input bar.
   */
  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'end'
        });
      }, 50);
    });
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
      const response = await sendChatMessage(
        sessionId,
        userMessage.text
      );

      const hasOutfit =
        response.outfit_suggestions &&
        response.outfit_suggestions.length > 0;

      const botMessage = {
        id: (Date.now() + 1).toString(),

        // No "Here's what I'd suggest:" bubble when outfit cards exist
        text: hasOutfit ? '' : response.reply,

        isUser: false,
        outfitSuggestions: response.outfit_suggestions,
        imageUrls: response.image_urls,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: "Sorry, I couldn't reach the stylist engine right now. Please try again in a moment.",
          isUser: false,
          timestamp: Date.now()
        }
      ]);
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

      const newSid = crypto?.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2, 15);

      setSessionId(newSid);

      setMessages([
        {
          ...initialMessage,
          id: Date.now().toString()
        }
      ]);
    } catch (e) {
      console.error('Error resetting chat', e);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white relative overflow-hidden">

      {/* Background pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.18]"
        style={{
          backgroundImage: BG_PATTERN,
          backgroundSize: '200px 200px'
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 shrink-0 relative z-10 bg-white">
        <div className="flex items-center gap-3">

          <button
            onClick={() => navigate(-1)}
            className="p-2.5 text-pink-700 hover:text-white hover:bg-pink-600 transition-colors rounded-full bg-pink-50 border border-pink-200"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          <span className="font-display text-2xl font-bold text-neutral-900">
            AI stylist
          </span>

        </div>

        <button
          onClick={handleReset}
          className="p-2 text-neutral-500 hover:text-pink-600 transition-colors rounded-full hover:bg-pink-50"
          title="Reset chat"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

      </div>

      {/* Chat area */}
      <div
        className="
          flex-1
          overflow-y-auto
          relative
          z-10
        "
      >
        <div
          className="
            p-4
            md:p-6
            space-y-4
            max-w-2xl
            mx-auto
            w-full
            pb-72
          "
        >

          {/* Messages */}
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-2"
            >

              {/* Only render chat bubble if there is text */}
              {msg.text && (
                <ChatBubble
                  message={msg.text}
                  isUser={msg.isUser}
                />
              )}

              {/* Reference images */}
              {(!msg.outfitSuggestions ||
                msg.outfitSuggestions.length === 0) &&
                msg.imageUrls &&
                msg.imageUrls.length > 0 && (
                  <div
                    className={`flex flex-wrap gap-2 mt-2 ${
                      msg.isUser
                        ? 'justify-end'
                        : 'justify-start ml-2'
                    }`}
                  >
                    {msg.imageUrls.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt="Reference"
                        className="w-auto h-36 rounded-xl object-cover border border-neutral-200"
                      />
                    ))}
                  </div>
                )}

              {/* Outfit suggestions */}
              {msg.outfitSuggestions &&
                msg.outfitSuggestions.length > 0 && (
                  <div className="mt-2 space-y-3">
                    {msg.outfitSuggestions.map((outfit, i) => (
                      <OutfitCard
                        key={i}
                        outfit={outfit}
                      />
                    ))}
                  </div>
                )}

            </motion.div>
          ))}

          {/* Thinking indicator */}
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-2 items-end max-w-[80%] pb-10"
            >

              {/* AI avatar */}
              <div className="w-8 h-8 rounded-full bg-pink-600 text-white flex items-center justify-center flex-shrink-0 font-display font-bold text-xs">
                AI
              </div>

              {/* Thinking bubble */}
              <div className="px-4 py-3 rounded-2xl rounded-bl-none bg-neutral-50 border border-neutral-200 flex items-center gap-1.5 h-[44px]">

                <div
                  className="w-2 h-2 bg-pink-500 rounded-full animate-bounce"
                  style={{ animationDelay: '0ms' }}
                />

                <div
                  className="w-2 h-2 bg-pink-500 rounded-full animate-bounce"
                  style={{ animationDelay: '150ms' }}
                />

                <div
                  className="w-2 h-2 bg-pink-500 rounded-full animate-bounce"
                  style={{ animationDelay: '300ms' }}
                />

              </div>

            </motion.div>
          )}

          {/* Large space after the latest content.
              This forces the thinking indicator well above
              the fixed input bar. */}
          <div className="h-32" />

          {/* Scroll anchor */}
          <div
            ref={messagesEndRef}
            className="h-1"
          />

        </div>
      </div>

      {/* Fixed input area */}
      <div
        className="
          fixed
          bottom-0
          left-0
          right-0
          bg-white
          border-t
          border-neutral-200
          p-4
          z-30
        "
      >
        <div className="flex items-center gap-3 max-w-2xl mx-auto">

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask for outfit ideas, color matches..."
            className="
              flex-1
              max-h-32
              min-h-[48px]
              rounded-xl
              bg-neutral-50
              px-4
              py-3
              border
              border-neutral-200
              focus:outline-none
              focus:ring-2
              focus:ring-pink-500
              focus:border-pink-500
              text-neutral-900
              placeholder:text-neutral-400
              resize-none
              text-sm
            "
            rows={1}
          />

          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="
              rounded-full
              bg-pink-600
              text-white
              p-3
              h-12
              w-12
              flex
              items-center
              justify-center
              shrink-0
              disabled:opacity-40
              hover:bg-pink-700
              transition
            "
          >
            <Send className="w-5 h-5 ml-0.5" />
          </button>

        </div>
      </div>

    </div>
  );
}