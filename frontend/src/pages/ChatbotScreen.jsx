import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Bell,
  ChevronDown,
  Home,
  ShoppingBag,
  Upload,
  Sparkles,
  Heart,
  Paperclip,
  Send,
  History,
  Plus,
  MessageSquare,
  X,
  Lock,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { sendChatMessage, resetChatSession, getUserChatSessions, getChatSessionHistory } from '../lib/api.js';

export default function ChatbotScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
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

  const navItems = [
    { label: 'Dashboard', icon: Home, path: '/dashboard' },
    { label: 'My Almari', icon: ShoppingBag, path: '/closet' },
    { label: 'Upload an Item', icon: Upload, path: '/upload' },
    { label: 'Build your own Outfit', icon: Sparkles, path: '/visualize' },
    { label: 'AI Stylist', icon: Sparkles, path: '/chatbot', active: true },
    { label: 'Favourites', icon: Heart, path: '/favorites' },
  ];

  const presetChips = [
    { label: 'Dinner date', icon: '🍽️' },
    { label: 'Casual day out', icon: '☀️' },
    { label: 'Office look', icon: '💼' },
    { label: 'Weekend brunch', icon: '☕' },
  ];

  return (
    <div className="flex h-screen bg-[#FBF7F2] font-serif text-[#4A3B32] overflow-hidden select-none">
      {/* ============================================================ */}
      {/* SIDEBAR (From Image 1 & 3) */}
      {/* ============================================================ */}
      <aside className="w-64 bg-[#F5EFE6] border-r border-[#E6DCCF] flex flex-col justify-between relative shadow-md shrink-0">
        {/* Brass Door Handle Detail on Left Edge */}
        <div className="absolute left-1 top-1/2 -translate-y-1/2 w-3 h-32 bg-gradient-to-b from-[#C5A059] via-[#E8D1A7] to-[#9A7B3E] rounded-r-md border border-[#8C6D2F] shadow-lg flex items-center justify-center pointer-events-none">
          <div className="w-1 h-20 bg-[#6E5421] rounded-full opacity-60" />
        </div>

        <div>
          {/* Ornate Wooden Almari Adda Logo Badge */}
          <div className="p-6 flex justify-center">
            <div className="bg-[#4E2A1E] text-[#F3E5D8] px-6 py-3 rounded-2xl border-2 border-[#C5A059] shadow-md flex flex-col items-center justify-center text-center">
              <span className="font-serif tracking-widest text-xs uppercase text-[#C5A059]">Almari</span>
              <span className="font-serif font-bold text-lg tracking-wider text-[#F3E5D8]">ADDA</span>
            </div>
          </div>

          {/* Navigation Options List (Image 3) */}
          <nav className="px-4 space-y-1.5 mt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.active || location.pathname === item.path;
              return (
                <button
                  key={item.label}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all text-left ${
                    isActive
                      ? 'bg-[#F2E3E5] text-[#800020] font-semibold border border-[#E4C5CB] shadow-sm'
                      : 'text-[#6A5A4D] hover:bg-[#EBE2D5] hover:text-[#3B2D26]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#800020]' : 'text-[#8C7A6B]'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Ornamental Flourish & History Button */}
        <div className="p-4 border-t border-[#E6DCCF] flex flex-col gap-2">
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#EBE2D5] text-[#6A5A4D] hover:text-[#800020] hover:bg-[#E2D6C6] transition text-xs font-semibold border border-[#D9CEBF]"
          >
            <History className="w-4 h-4 text-[#800020]" />
            <span>Chat History ({sessions.length})</span>
          </button>
          <div className="text-center text-[11px] text-[#A39283] tracking-widest font-serif opacity-70">
            ~ ✤ ~
          </div>
        </div>
      </aside>

      {/* ============================================================ */}
      {/* MAIN CONTENT AREA */}
      {/* ============================================================ */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative bg-[#FBF7F2]">
        {/* TOP HEADER BAR (From Image 1 & 2) */}
        <header className="h-16 px-8 flex items-center justify-between border-b border-[#E6DCCF]/60 bg-[#FBF7F2]/80 backdrop-blur-sm shrink-0 z-20">
          {/* Search Input */}
          <div className="relative w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A39283]" />
            <input
              type="text"
              placeholder="Search in your almari..."
              className="w-full pl-10 pr-4 py-2 rounded-full bg-[#F5EFE6] border border-[#E6DCCF] text-xs text-[#3B2D26] placeholder-[#A39283] focus:outline-none focus:ring-1 focus:ring-[#800020]/30"
            />
          </div>

          {/* User Profile & Notifications */}
          <div className="flex items-center gap-4">
            <button className="p-2 text-[#6A5A4D] hover:bg-[#EBE2D5] rounded-full relative transition">
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 rounded-full bg-[#800020] absolute top-1.5 right-1.5" />
            </button>
            <div className="flex items-center gap-2 cursor-pointer pl-2 border-l border-[#E6DCCF]">
              <img src={userAvatar} alt="Maya" className="w-8 h-8 rounded-full object-cover border border-[#C5A059]" />
              <span className="text-xs font-semibold text-[#3B2D26]">{userName}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#6A5A4D]" />
            </div>
          </div>
        </header>

        {/* CHAT CONTAINER BODY */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col items-center relative z-10">
          <div className="w-full max-w-4xl flex flex-col h-full">
            {/* Title & Subtitle Area (Image 2) */}
            <div className="mb-4 text-left">
              <h1 className="font-serif text-3xl font-bold text-[#3B2D26]">AI Stylist</h1>
              <p className="text-xs text-[#8C7A6B] mt-0.5">Ask for outfit ideas, styling tips, and wardrobe help.</p>
            </div>

            {/* CURVY VINTAGE FRAME CONTAINER (Image 2 & Image 4 Asset) */}
            <div
              className="flex-1 rounded-[32px] p-6 md:p-8 flex flex-col justify-between relative shadow-lg border border-[#E6DCCF] overflow-hidden"
              style={{
                backgroundImage: 'url("/vintage_frame.png")',
                backgroundSize: '100% 100%',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundColor: '#FFFDF9'
              }}
            >
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto pr-2 space-y-6 pt-4 pb-4">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col space-y-3"
                  >
                    {!msg.isUser ? (
                      /* AI STYLIST MSG BUBBLE (Image 2) */
                      <div className="flex items-start gap-3 max-w-[85%]">
                        <div className="w-9 h-9 rounded-full bg-[#800020] text-[#F3E5D8] flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                          <Sparkles className="w-4 h-4 text-[#E6C280]" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[11px] font-semibold text-[#800020] mb-1">AI Stylist</span>
                          <div className="bg-[#FAF5EF] border border-[#EBDCCF] text-[#4A3B32] p-4 rounded-2xl rounded-tl-sm text-xs leading-relaxed shadow-sm whitespace-pre-line">
                            {msg.text}
                            <span className="block text-[10px] text-[#A39283] text-right mt-1.5 font-sans">
                              {msg.timestamp}
                            </span>
                          </div>

                          {/* Quick Preset Prompt Chips (Only shown on initial welcome message) */}
                          {msg.id === 'welcome' && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {presetChips.map((chip) => (
                                <button
                                  key={chip.label}
                                  onClick={() => handleSend(`Can you suggest a ${chip.label.toLowerCase()} outfit?`)}
                                  className="px-3.5 py-1.5 rounded-xl bg-[#FAF5EF] border border-[#EBDCCF] hover:border-[#800020]/40 text-[#5C4A3E] hover:text-[#800020] text-xs flex items-center gap-1.5 transition shadow-xs"
                                >
                                  <span>{chip.icon}</span>
                                  <span>{chip.label}</span>
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Outfit Cards */}
                          {msg.outfitSuggestions && msg.outfitSuggestions.length > 0 && (
                            <div className="mt-3 space-y-3">
                              {msg.outfitSuggestions.map((outfit, idx) => (
                                <div key={idx} className="bg-[#FFFDF9] border border-[#E6DCCF] rounded-2xl p-4 shadow-sm">
                                  <span className="text-xs font-bold text-[#800020] block mb-2 font-serif">Suggested Outfit</span>
                                  <div className="flex gap-3 overflow-x-auto pb-2">
                                    {outfit.items?.map((item, i) => (
                                      <div key={i} className="flex flex-col items-center bg-[#FAF5EF] p-2 rounded-xl border border-[#EBDCCF] w-20 shrink-0">
                                        <img src={item.image_url} alt={item.category} className="w-14 h-16 object-contain mb-1" />
                                        <span className="text-[10px] text-[#5C4A3E] font-medium truncate w-full text-center">{item.subcategory || item.category}</span>
                                      </div>
                                    ))}
                                  </div>
                                  <p className="text-xs text-[#5C4A3E] mt-2 bg-[#FAF5EF] p-2.5 rounded-xl border border-[#EBDCCF] leading-relaxed">{outfit.reasoning}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* USER MSG BUBBLE (Image 2) */
                      <div className="flex items-start justify-end gap-3 self-end max-w-[80%] ml-auto">
                        <div className="flex flex-col items-end">
                          <div className="bg-[#800020] text-[#FFFDF9] p-3.5 px-4 rounded-2xl rounded-tr-sm text-xs leading-relaxed shadow-sm">
                            {msg.text}
                            <span className="block text-[9px] text-[#F3C5CE] text-right mt-1 font-sans">
                              {msg.timestamp} ✓✓
                            </span>
                          </div>
                        </div>
                        <img src={userAvatar} alt="Maya" className="w-8 h-8 rounded-full object-cover border border-[#C5A059] shrink-0 mt-0.5" />
                      </div>
                    )}
                  </motion.div>
                ))}

                {/* Thinking / Loading indicator */}
                {loading && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#800020] text-[#F3E5D8] flex items-center justify-center shrink-0 shadow-sm">
                      <Sparkles className="w-4 h-4 text-[#E6C280]" />
                    </div>
                    <div className="bg-[#FAF5EF] border border-[#EBDCCF] p-3.5 rounded-2xl text-xs text-[#8C7A6B] flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#800020] animate-ping" />
                      <span>Styling your outfit...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* INPUT BAR AT BOTTOM (Image 2) */}
              <div className="pt-3 border-t border-[#EBDCCF]/60">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask your stylist anything..."
                    className="w-full py-3.5 pl-5 pr-24 rounded-full bg-[#FFFDF9] border border-[#E6DCCF] text-xs text-[#3B2D26] placeholder-[#A39283] shadow-inner focus:outline-none focus:ring-1 focus:ring-[#800020]/40"
                  />
                  <div className="absolute right-2 flex items-center gap-1.5">
                    <button className="p-2 text-[#A39283] hover:text-[#800020] transition rounded-full">
                      <Paperclip className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleSend()}
                      disabled={!input.trim() || loading}
                      className="w-9 h-9 rounded-full bg-[#800020] hover:bg-[#66001A] disabled:opacity-40 text-[#FFFDF9] flex items-center justify-center transition shadow-sm"
                    >
                      <Send className="w-4 h-4 ml-0.5" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-1 mt-2 text-[10px] text-[#A39283]">
                  <Lock className="w-3 h-3 text-[#A39283]" />
                  <span>Your conversations are private and secure</span>
                </div>
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
              className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-sm bg-[#FBF7F2] h-full shadow-2xl z-10 flex flex-col border-r border-[#E6DCCF]"
            >
              <div className="p-4 border-b border-[#E6DCCF] flex items-center justify-between bg-[#F5EFE6]">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-[#800020]" />
                  <span className="font-serif font-bold text-[#3B2D26] text-base">Your Conversations</span>
                </div>
                <button
                  onClick={() => setIsHistoryOpen(false)}
                  className="p-1.5 text-[#8C7A6B] hover:text-[#3B2D26] rounded-full hover:bg-[#EBE2D5]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 border-b border-[#E6DCCF]">
                <button
                  onClick={handleNewChat}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#800020] hover:bg-[#66001A] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Start New Conversation</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {sessions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-center p-4">
                    <MessageSquare className="w-8 h-8 text-[#A39283] mb-2" />
                    <p className="text-[#6A5A4D] text-xs font-medium">No previous conversations yet.</p>
                    <p className="text-[#8C7A6B] text-[11px] mt-1">Start chatting with the AI stylist to save history!</p>
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
                            ? 'bg-[#F2E3E5] border-[#E4C5CB] shadow-sm'
                            : 'bg-[#FFFDF9] border-[#E6DCCF] hover:border-[#800020]/30 hover:bg-[#F9F3EA]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-xs font-bold truncate ${isActive ? 'text-[#800020]' : 'text-[#3B2D26]'}`}>
                            {s.title || 'Styling Conversation'}
                          </span>
                          {isActive && <span className="w-2 h-2 rounded-full bg-[#800020] shrink-0" />}
                        </div>
                        <span className="text-[10px] text-[#8C7A6B] font-medium">
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