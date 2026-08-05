import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Bell,
  ChevronDown,
  Sparkles,
  Paperclip,
  Send,
  History,
  Plus,
  MessageSquare,
  X,
  Lock,
  CheckCheck
} from 'lucide-react';
import Sidebar from '../components/Sidebar.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { sendChatMessage, getUserChatSessions, getChatSessionHistory } from '../lib/api.js';

export default function ChatbotScreen() {
  const auth = useAuth() || {};
  const { user } = auth;
  const userId = user?.id || user?.email || 'anonymous_user';
  const userName = user?.user_metadata?.full_name || 'Maya';
  const userAvatar = user?.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop';

  const [sessionId, setSessionId] = useState('');
  const [sessionTitle, setSessionTitle] = useState('New Conversation');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const [sessions, setSessions] = useState([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const messagesEndRef = useRef(null);

  const initialMessage = {
    id: 'welcome',
    text: `Good evening, ${userName}! ✨\nI'm your AI stylist, here to help you look and feel your best.\nWhat are we dressing for today?`,
    isUser: false,
    timestamp: '6:45 PM'
  };

  const [messages, setMessages] = useState([initialMessage]);

  const loadUserSessions = async () => {
    try {
      const list = await getUserChatSessions(userId);
      setSessions(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error('Failed to load user chat sessions', e);
    }
  };

  useEffect(() => {
    const sid = crypto?.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2, 15);

    setSessionId(sid);
    loadUserSessions();
  }, [userId]);

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

  const handleSend = async (customMessage = null) => {
    const messageText = customMessage || input.trim();
    if (!messageText || loading) return;

    const userMessage = {
      id: Date.now().toString(),
      text: messageText,
      isUser: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!customMessage) setInput('');
    setLoading(true);

    try {
      const response = await sendChatMessage(sessionId, messageText, userId);

      if (response.title) {
        setSessionTitle(response.title);
      }
      loadUserSessions();

      const botMessage = {
        id: (Date.now() + 1).toString(),
        text: response.reply || "I've put together some great options from your almari!",
        isUser: false,
        outfitSuggestions: response.outfit_suggestions || [],
        imageUrls: response.image_urls || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: "Sorry, I couldn't reach the stylist engine right now. Please try again in a moment.",
          isUser: false,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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

  const handleSelectSession = async (session) => {
    if (session.id === sessionId) {
      setIsHistoryOpen(false);
      return;
    }

    setSessionId(session.id);
    setSessionTitle(session.title || 'Styling Conversation');
    setIsHistoryOpen(false);

    try {
      const history = await getChatSessionHistory(session.id);
      if (Array.isArray(history) && history.length > 0) {
        const formatted = history.map((m) => {
          const suggestions = m.outfit_suggestions || [];
          const image_urls = suggestions.flatMap((s) => (s.items || []).map((i) => i.image_url));
          return {
            id: m.id,
            text: m.message,
            isUser: m.sender === 'user',
            outfitSuggestions: suggestions,
            imageUrls: image_urls,
            timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
        });
        setMessages(formatted);
      } else {
        setMessages([initialMessage]);
      }
    } catch (e) {
      console.error('Failed to load session history', e);
    }
  };

  const handleNewChat = () => {
    const newSid = crypto?.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2, 15);

    setSessionId(newSid);
    setSessionTitle('New Conversation');
    setMessages([{ ...initialMessage, id: Date.now().toString() }]);
    setIsHistoryOpen(false);
  };

  const presetChips = [
    { label: 'Dinner date', icon: '🍽️' },
    { label: 'Casual day out', icon: '☀️' },
    { label: 'Office look', icon: '💼' },
    { label: 'Weekend brunch', icon: '☕' },
  ];

  return (
    <div className="flex h-screen w-screen bg-[#F9F3EA] font-serif text-[#3D2417] overflow-hidden select-none">
      {/* ============================================================ */}
      {/* OFFICIAL TEAMMATES SIDEBAR (src/components/Sidebar.jsx) */}
      {/* ============================================================ */}
      <Sidebar />

      {/* ============================================================ */}
      {/* MAIN AI STYLIST CONTENT (Exact Reference Image 2) */}
      {/* ============================================================ */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative bg-[#F9F3EA] px-8 py-5">
        {/* Top Right Golden Floral Engraving Flourish (Exact Reference Image 2) */}
        <div className="absolute top-0 right-0 w-64 h-64 pointer-events-none opacity-45 z-0">
          <svg viewBox="0 0 200 200" fill="none" stroke="#D1BFA9" strokeWidth="1.5">
            <path d="M200 0 C 140 30, 90 90, 80 180 M 160 20 C 130 50, 120 70, 110 110 M 180 60 C 140 80, 130 110, 130 140" />
            <circle cx="160" cy="20" r="3" fill="#D1BFA9" />
            <circle cx="110" cy="110" r="3" fill="#D1BFA9" />
            <circle cx="180" cy="60" r="3" fill="#D1BFA9" />
          </svg>
        </div>

        {/* TOP BAR HEADER */}
        <header className="h-14 flex items-center justify-between relative z-20 shrink-0 mb-2">
          {/* Search Pill Input */}
          <div className="relative w-96 mx-auto">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#A89478]" />
            <input
              type="text"
              placeholder="Search in your almari..."
              className="w-full pl-11 pr-4 py-2 rounded-full bg-[#F3E6CF]/60 border border-[#E6D5B8] text-xs text-[#3D2417] placeholder-[#A89478] focus:outline-none focus:ring-1 focus:ring-[#7A2331]/30 shadow-inner"
            />
          </div>

          {/* Right Header Items: History Trigger & Profile */}
          <div className="flex items-center gap-3 absolute right-0">
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F3E6CF] text-[#7A2331] hover:bg-[#EBDBC0] transition text-xs font-semibold border border-[#E6D5B8] shadow-xs"
              title="Chat History"
            >
              <History className="w-3.5 h-3.5" />
              <span>History ({sessions.length})</span>
            </button>

            <button className="p-2 text-[#8A7360] hover:bg-[#F3E6CF] rounded-full relative transition">
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 rounded-full bg-[#7A2331] absolute top-1.5 right-1.5" />
            </button>
            <div className="flex items-center gap-2 cursor-pointer">
              <img src={userAvatar} alt="Maya" className="w-8 h-8 rounded-full object-cover border border-[#C9A769]" />
              <span className="text-xs font-serif font-semibold text-[#3D2417]">{userName}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#8A7360]" />
            </div>
          </div>
        </header>

        {/* CHAT CONTAINER WRAPPER */}
        <div className="flex-1 flex flex-col justify-between relative overflow-hidden z-10">
          {/* Title & Subtitle (Exact Reference Image 2) */}
          <div className="mb-3 text-left pl-2">
            <h1 className="font-serif text-3xl font-bold text-[#3D2417] tracking-wide">AI Stylist</h1>
            <p className="text-xs text-[#8A7360] mt-0.5 font-serif">Ask for outfit ideas, styling tips, and wardrobe help.</p>
          </div>

          {/* MAIN VINTAGE ARCH FRAME CONTAINER (Exact Reference Image 2) */}
          <div className="flex-1 rounded-[36px] bg-[#FDFBF7] border-2 border-[#E8DCCF] p-6 md:p-8 flex flex-col justify-between relative shadow-sm overflow-hidden">
            {/* Top Crown Filigree Crest Ornament */}
            <div className="w-full flex justify-center mb-3">
              <svg width="260" height="32" viewBox="0 0 260 32" fill="none" stroke="#C9B6A0" strokeWidth="1.2">
                <path d="M 10 30 Q 60 4, 130 4 Q 200 4, 250 30" />
                <path d="M 35 30 Q 75 10, 130 10 Q 185 10, 225 30" strokeWidth="0.8" />
                <circle cx="130" cy="4" r="2.5" fill="#C9B6A0" />
              </svg>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-6 pt-2 pb-2">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col space-y-3"
                >
                  {!msg.isUser ? (
                    /* AI STYLIST BUBBLE (Exact Reference Image 2) */
                    <div className="flex items-start gap-3.5 max-w-[85%]">
                      <div className="w-9 h-9 rounded-full bg-[#7A2331] text-[#FDFBF7] flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                        <Sparkles className="w-4 h-4 text-[#F3D7A4]" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[12px] font-serif font-bold text-[#7A2331] mb-1">AI Stylist</span>
                        <div className="bg-[#FBF8F3] border border-[#E8DCCF] text-[#3D2417] p-4 rounded-2xl rounded-tl-xs text-xs leading-relaxed shadow-2xs whitespace-pre-line relative">
                          {msg.text}
                          <span className="block text-[10px] text-[#A89478] text-right mt-2 font-sans">
                            {msg.timestamp}
                          </span>
                        </div>

                        {/* Quick Preset Action Chips (Exact Reference Image 2) */}
                        {msg.id === 'welcome' && (
                          <div className="flex flex-wrap gap-2.5 mt-3">
                            {presetChips.map((chip) => (
                              <button
                                key={chip.label}
                                onClick={() => handleSend(`Can you suggest a ${chip.label.toLowerCase()} outfit?`)}
                                className="px-4 py-2 rounded-xl bg-[#FDFBF7] border border-[#E8DCCF] hover:border-[#7A2331]/40 text-[#6B5645] hover:text-[#7A2331] text-xs flex items-center gap-2 transition shadow-2xs font-serif"
                              >
                                <span>{chip.icon}</span>
                                <span>{chip.label}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Outfit Suggestions Cards */}
                        {msg.outfitSuggestions && msg.outfitSuggestions.length > 0 && (
                          <div className="mt-3 space-y-3">
                            {msg.outfitSuggestions.map((outfit, idx) => (
                              <div key={idx} className="bg-[#FBF8F3] border border-[#E8DCCF] rounded-2xl p-4 shadow-2xs">
                                <span className="text-xs font-bold text-[#7A2331] block mb-2 font-serif">Suggested Outfit</span>
                                <div className="flex gap-3 overflow-x-auto pb-2">
                                  {outfit.items?.map((item, i) => (
                                    <div key={i} className="flex flex-col items-center bg-[#F9F3EA] p-2 rounded-xl border border-[#E6D5B8] w-20 shrink-0">
                                      <img src={item.image_url} alt={item.category} className="w-14 h-16 object-contain mb-1" />
                                      <span className="text-[10px] text-[#6B5645] font-medium truncate w-full text-center">{item.subcategory || item.category}</span>
                                    </div>
                                  ))}
                                </div>
                                <p className="text-xs text-[#6B5645] mt-2 bg-[#F9F3EA] p-2.5 rounded-xl border border-[#E6D5B8] leading-relaxed">{outfit.reasoning}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* USER BUBBLE (Exact Reference Image 2 - Peach/Salmon) */
                    <div className="flex items-start justify-end gap-3 self-end max-w-[80%] ml-auto">
                      <div className="flex flex-col items-end">
                        <div className="bg-[#F5DCD3] text-[#3D2417] p-3.5 px-4 rounded-2xl rounded-tr-xs text-xs leading-relaxed shadow-2xs border border-[#E8C5BA]">
                          {msg.text}
                          <span className="flex items-center justify-end gap-1 text-[9px] text-[#8A7360] text-right mt-1.5 font-sans">
                            <span>{msg.timestamp}</span>
                            <CheckCheck className="w-3.5 h-3.5 text-[#7A2331]" />
                          </span>
                        </div>
                      </div>
                      <img src={userAvatar} alt="Maya" className="w-8.5 h-8.5 rounded-full object-cover border border-[#C9A769] shrink-0 mt-0.5" />
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Thinking Indicator */}
              {loading && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#7A2331] text-[#FDFBF7] flex items-center justify-center shrink-0 shadow-sm">
                    <Sparkles className="w-4 h-4 text-[#F3D7A4]" />
                  </div>
                  <div className="bg-[#FBF8F3] border border-[#E8DCCF] p-3.5 rounded-2xl text-xs text-[#8A7360] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#7A2331] animate-ping" />
                    <span>Styling your outfit...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* INPUT BAR AT BOTTOM (Exact Reference Image 2) */}
            <div className="pt-3 border-t border-[#E8DCCF]">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask your stylist anything..."
                  className="w-full py-3.5 pl-6 pr-24 rounded-full bg-[#FFFDF9] border border-[#E8DCCF] text-xs text-[#3D2417] placeholder-[#A89478] focus:outline-none focus:ring-1 focus:ring-[#7A2331]/40 shadow-inner"
                />
                <div className="absolute right-3 flex items-center gap-2">
                  <button className="p-1.5 text-[#A89478] hover:text-[#7A2331] transition">
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleSend()}
                    disabled={!input.trim() || loading}
                    className="w-8.5 h-8.5 rounded-full bg-[#7A2331] hover:bg-[#5E1B26] disabled:opacity-40 text-[#FFFDF9] flex items-center justify-center transition shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5 ml-0.5" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-center gap-1.5 mt-2.5 text-[10px] text-[#A89478]">
                <Lock className="w-3 h-3 text-[#A89478]" />
                <span>Your conversations are private and secure</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ============================================================ */}
      {/* SLIDE-OUT CHAT HISTORY DRAWER */}
      {/* ============================================================ */}
      <AnimatePresence>
        {isHistoryOpen && (
          <div className="fixed inset-0 z-50 flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHistoryOpen(false)}
              className="fixed inset-0 bg-neutral-900/30 backdrop-blur-xs"
            />

            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-sm bg-[#F9F3EA] h-full shadow-2xl z-50 flex flex-col border-r border-[#E6D5B8]"
            >
              <div className="p-4 border-b border-[#E6D5B8] flex items-center justify-between bg-[#F3E6CF]">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-[#7A2331]" />
                  <span className="font-serif font-bold text-[#3D2417] text-base">Your Conversations</span>
                </div>
                <button
                  onClick={() => setIsHistoryOpen(false)}
                  className="p-1.5 text-[#8A7360] hover:text-[#3D2417] rounded-full hover:bg-[#EBDBC0]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 border-b border-[#E6D5B8]">
                <button
                  onClick={handleNewChat}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#7A2331] hover:bg-[#5E1B26] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Start New Conversation</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {sessions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-center p-4">
                    <MessageSquare className="w-8 h-8 text-[#A89478] mb-2" />
                    <p className="text-[#6B5645] text-xs font-medium">No previous conversations yet.</p>
                    <p className="text-[#8A7360] text-[11px] mt-1">Start chatting with the AI stylist to save history!</p>
                  </div>
                ) : (
                  sessions.map((s) => {
                    const isActive = s.id === sessionId;
                    return (
                      <button
                        key={s.id}
                        onClick={() => handleSelectSession(s)}
                        className={`w-full text-left p-3 rounded-xl border transition-all flex flex-col gap-1 ${
                          isActive
                            ? 'bg-[#7a2331]/10 border-[#E8C5BA] shadow-xs'
                            : 'bg-[#FDFBF7] border-[#E6D5B8] hover:border-[#7A2331]/30 hover:bg-[#F3E6CF]/50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-xs font-bold truncate ${isActive ? 'text-[#7A2331]' : 'text-[#3D2417]'}`}>
                            {s.title || 'Styling Conversation'}
                          </span>
                          {isActive && <span className="w-2 h-2 rounded-full bg-[#7A2331] shrink-0" />}
                        </div>
                        <span className="text-[10px] text-[#8A7360] font-medium">
                          {s.updated_at ? new Date(s.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}