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
  CheckCheck
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { sendChatMessage, getUserChatSessions, getChatSessionHistory } from '../lib/api.js';

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
    <div
      className="flex h-screen w-screen font-serif text-[#3E3127] overflow-hidden select-none relative"
      style={{
        backgroundImage: 'url("/full_bg.png")',
        backgroundSize: '100% 100%',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* ============================================================ */}
      {/* SIDEBAR OVERLAY (Left ~21% matching full_bg.png) */}
      {/* ============================================================ */}
      <aside className="w-[21%] h-full flex flex-col justify-between relative shrink-0 z-20 pl-4 pr-3 py-6">
        {/* Brass Door Handle & Latch along left side */}
        <div className="absolute -left-1 top-1/2 -translate-y-1/2 z-30 pointer-events-none">
          <img src="/door_handle.png" alt="Door Handle" className="h-52 w-auto object-contain drop-shadow-md" />
        </div>

        <div>
          {/* Ornate Almari Adda Wooden Logo */}
          <div className="flex justify-center mb-6 pt-2">
            <img src="/almari_logo.png" alt="Almari Adda" className="h-20 w-auto object-contain drop-shadow-md" />
          </div>

          {/* Navigation Menu (Image 3) */}
          <nav className="space-y-2 px-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.active || location.pathname === item.path;
              return (
                <button
                  key={item.label}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs md:text-sm font-medium transition-all text-left ${
                    isActive
                      ? 'bg-[#EBDCD9] text-[#6B1D2F] font-bold border border-[#DEBEB6] shadow-xs'
                      : 'text-[#615246] hover:bg-[#E7DCD0]/70 hover:text-[#3E3127]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#6B1D2F]' : 'text-[#857467]'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Chat History Button at Bottom of Sidebar */}
        <div className="px-2 pt-2">
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#E7DCD0]/80 hover:bg-[#DFD3C5] text-[#615246] hover:text-[#6B1D2F] transition text-xs font-semibold border border-[#D5C7B7]"
          >
            <History className="w-4 h-4 text-[#6B1D2F]" />
            <span>Chat History ({sessions.length})</span>
          </button>
        </div>
      </aside>

      {/* ============================================================ */}
      {/* MAIN AI STYLIST CONTENT (Right ~79% matching full_bg.png frame) */}
      {/* ============================================================ */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative z-10 px-8 py-5">
        {/* TOP BAR (Header Aligned with full_bg.png Search Box) */}
        <header className="h-14 flex items-center justify-between relative z-20 mb-3">
          {/* Centered Search Bar */}
          <div className="relative w-96 mx-auto">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#A8988A]" />
            <input
              type="text"
              placeholder="Search in your almari..."
              className="w-full pl-11 pr-4 py-2 rounded-full bg-[#F5EFE6]/90 border border-[#E2D6C6] text-xs text-[#3E3127] placeholder-[#A8988A] focus:outline-none focus:ring-1 focus:ring-[#6B1D2F]/30 shadow-inner"
            />
          </div>

          {/* User Profile & Bell */}
          <div className="flex items-center gap-4 absolute right-0">
            <button className="p-2 text-[#615246] hover:bg-[#E7DCD0] rounded-full relative transition">
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 rounded-full bg-[#6B1D2F] absolute top-1.5 right-1.5" />
            </button>
            <div className="flex items-center gap-2 cursor-pointer">
              <img src={userAvatar} alt="Maya" className="w-8 h-8 rounded-full object-cover border border-[#C5A059]" />
              <span className="text-xs font-serif font-semibold text-[#3E3127]">{userName}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#615246]" />
            </div>
          </div>
        </header>

        {/* CHAT CONTAINER WRAPPER (Fits Inside the Vintage Frame) */}
        <div className="flex-1 flex flex-col justify-between pt-2 pb-6 px-6 md:px-12 relative overflow-hidden">
          {/* Title & Subtitle */}
          <div className="mb-3 text-left pl-2">
            <h1 className="font-serif text-3xl font-bold text-[#2C221B] tracking-wide">AI Stylist</h1>
            <p className="text-xs text-[#827164] mt-0.5 font-serif">Ask for outfit ideas, styling tips, and wardrobe help.</p>
          </div>

          {/* MESSAGES SCROLL AREA (Fills frame interior) */}
          <div className="flex-1 overflow-y-auto pr-3 space-y-6 pt-4 pb-2 my-2">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col space-y-3"
              >
                {!msg.isUser ? (
                  /* AI STYLIST MSG BUBBLE (Exact Image 2) */
                  <div className="flex items-start gap-3.5 max-w-[85%]">
                    <div className="w-9 h-9 rounded-full bg-[#6B1D2F] text-[#FDFBF7] flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                      <Sparkles className="w-4 h-4 text-[#F3D7A4]" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[12px] font-serif font-bold text-[#6B1D2F] mb-1">AI Stylist</span>
                      <div className="bg-[#FBF8F3] border border-[#E8DCCF] text-[#3E3127] p-4 rounded-2xl rounded-tl-xs text-xs leading-relaxed shadow-2xs whitespace-pre-line relative">
                        {msg.text}
                        <span className="block text-[10px] text-[#A39283] text-right mt-2 font-sans">
                          {msg.timestamp}
                        </span>
                      </div>

                      {/* Quick Preset Action Chips (Image 2) */}
                      {msg.id === 'welcome' && (
                        <div className="flex flex-wrap gap-2.5 mt-3">
                          {presetChips.map((chip) => (
                            <button
                              key={chip.label}
                              onClick={() => handleSend(`Can you suggest a ${chip.label.toLowerCase()} outfit?`)}
                              className="px-4 py-2 rounded-xl bg-[#FDFBF7] border border-[#E6DCCF] hover:border-[#6B1D2F]/40 text-[#5C4A3E] hover:text-[#6B1D2F] text-xs flex items-center gap-2 transition shadow-2xs font-serif"
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
                            <div key={idx} className="bg-[#FBF8F3] border border-[#E8DCCF] rounded-2xl p-4 shadow-2xs">
                              <span className="text-xs font-bold text-[#6B1D2F] block mb-2 font-serif">Suggested Outfit</span>
                              <div className="flex gap-3 overflow-x-auto pb-2">
                                {outfit.items?.map((item, i) => (
                                  <div key={i} className="flex flex-col items-center bg-[#F5EFE6] p-2 rounded-xl border border-[#E2D6C6] w-20 shrink-0">
                                    <img src={item.image_url} alt={item.category} className="w-14 h-16 object-contain mb-1" />
                                    <span className="text-[10px] text-[#5C4A3E] font-medium truncate w-full text-center">{item.subcategory || item.category}</span>
                                  </div>
                                ))}
                              </div>
                              <p className="text-xs text-[#5C4A3E] mt-2 bg-[#F5EFE6] p-2.5 rounded-xl border border-[#E2D6C6] leading-relaxed">{outfit.reasoning}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* USER MSG BUBBLE (Exact Image 2 - Muted Salmon/Peach) */
                  <div className="flex items-start justify-end gap-3 self-end max-w-[80%] ml-auto">
                    <div className="flex flex-col items-end">
                      <div className="bg-[#F5DCD3] text-[#3E3127] p-3.5 px-4 rounded-2xl rounded-tr-xs text-xs leading-relaxed shadow-2xs border border-[#E8C5BA]">
                        {msg.text}
                        <span className="flex items-center justify-end gap-1 text-[9px] text-[#8C7A6B] text-right mt-1.5 font-sans">
                          <span>{msg.timestamp}</span>
                          <CheckCheck className="w-3.5 h-3.5 text-[#6B1D2F]" />
                        </span>
                      </div>
                    </div>
                    <img src={userAvatar} alt="Maya" className="w-8.5 h-8.5 rounded-full object-cover border border-[#C5A059] shrink-0 mt-0.5" />
                  </div>
                )}
              </motion.div>
            ))}

            {/* Thinking Indicator */}
            {loading && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#6B1D2F] text-[#FDFBF7] flex items-center justify-center shrink-0 shadow-sm">
                  <Sparkles className="w-4 h-4 text-[#F3D7A4]" />
                </div>
                <div className="bg-[#FBF8F3] border border-[#E8DCCF] p-3.5 rounded-2xl text-xs text-[#827164] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#6B1D2F] animate-ping" />
                  <span>Styling your outfit...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* INPUT BAR AT BOTTOM (Exact Image 2) */}
          <div className="pt-3">
            <div className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask your stylist anything..."
                className="w-full py-3.5 pl-6 pr-24 rounded-full bg-[#FFFDF9] border border-[#E6DCCF] text-xs text-[#3E3127] placeholder-[#A8988A] focus:outline-none focus:ring-1 focus:ring-[#6B1D2F]/40 shadow-inner"
              />
              <div className="absolute right-3 flex items-center gap-2">
                <button className="p-1.5 text-[#A8988A] hover:text-[#6B1D2F] transition">
                  <Paperclip className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || loading}
                  className="w-8.5 h-8.5 rounded-full bg-[#6B1D2F] hover:bg-[#521422] disabled:opacity-40 text-[#FFFDF9] flex items-center justify-center transition shadow-sm"
                >
                  <Send className="w-3.5 h-3.5 ml-0.5" />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-center gap-1.5 mt-2 text-[10px] text-[#A8988A]">
              <Lock className="w-3 h-3 text-[#A8988A]" />
              <span>Your conversations are private and secure</span>
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
              className="relative w-full max-w-sm bg-[#F6F0E6] h-full shadow-2xl z-50 flex flex-col border-r border-[#E2D6C6]"
            >
              <div className="p-4 border-b border-[#E2D6C6] flex items-center justify-between bg-[#F2EBE1]">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-[#6B1D2F]" />
                  <span className="font-serif font-bold text-[#3E3127] text-base">Your Conversations</span>
                </div>
                <button
                  onClick={() => setIsHistoryOpen(false)}
                  className="p-1.5 text-[#857467] hover:text-[#3E3127] rounded-full hover:bg-[#E7DCD0]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 border-b border-[#E2D6C6]">
                <button
                  onClick={handleNewChat}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#6B1D2F] hover:bg-[#521422] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Start New Conversation</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {sessions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-center p-4">
                    <MessageSquare className="w-8 h-8 text-[#A8988A] mb-2" />
                    <p className="text-[#615246] text-xs font-medium">No previous conversations yet.</p>
                    <p className="text-[#857467] text-[11px] mt-1">Start chatting with the AI stylist to save history!</p>
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
                            ? 'bg-[#EBDCD9] border-[#DEBEB6] shadow-xs'
                            : 'bg-[#FDFBF7] border-[#E2D6C6] hover:border-[#6B1D2F]/30 hover:bg-[#F7F1E8]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-xs font-bold truncate ${isActive ? 'text-[#6B1D2F]' : 'text-[#3E3127]'}`}>
                            {s.title || 'Styling Conversation'}
                          </span>
                          {isActive && <span className="w-2 h-2 rounded-full bg-[#6B1D2F] shrink-0" />}
                        </div>
                        <span className="text-[10px] text-[#857467] font-medium">
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