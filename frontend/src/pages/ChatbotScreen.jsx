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
  RotateCcw,
  CheckCheck
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
    <div className="flex h-screen bg-[#F6F0E6] font-serif text-[#3E3127] overflow-hidden select-none">
      {/* ============================================================ */}
      {/* SIDEBAR (Exact Image 1 & Image 3) */}
      {/* ============================================================ */}
      <aside className="w-64 bg-[#F2EBE1] border-r border-[#E2D6C6] flex flex-col justify-between relative shadow-sm shrink-0 z-30">
        {/* Brass Door Handle & Lock Latch on Left Edge (Image 1) */}
        <div className="absolute -left-1 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center">
          <img src="/door_handle.png" alt="Handle" className="h-44 w-auto object-contain drop-shadow-md" />
        </div>

        <div>
          {/* Logo from Image 1 */}
          <div className="p-6 flex justify-center">
            <img src="/almari_logo.png" alt="Almari Adda" className="h-20 w-auto object-contain drop-shadow-sm" />
          </div>

          {/* Navigation Items (Image 3) */}
          <nav className="px-4 space-y-2 mt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.active || location.pathname === item.path;
              return (
                <button
                  key={item.label}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all text-left ${
                    isActive
                      ? 'bg-[#EBDCD9] text-[#701E2B] font-semibold border border-[#DEBEB6] shadow-xs'
                      : 'text-[#615246] hover:bg-[#E7DCD0] hover:text-[#3E3127]'
                  }`}
                >
                  <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-[#701E2B]' : 'text-[#857467]'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* History Drawer Trigger Button at Bottom */}
        <div className="p-4 border-t border-[#E2D6C6] flex flex-col gap-2">
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#E7DCD0] text-[#615246] hover:text-[#701E2B] hover:bg-[#DFD3C5] transition text-xs font-semibold border border-[#D5C7B7]"
          >
            <History className="w-4 h-4 text-[#701E2B]" />
            <span>Chat History ({sessions.length})</span>
          </button>
        </div>
      </aside>

      {/* ============================================================ */}
      {/* MAIN AI STYLIST CONTENT (Exact Image 2) */}
      {/* ============================================================ */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative bg-[#F6F0E6]">
        {/* Top Right Floral Branch Flourish Engraving (Image 2) */}
        <div className="absolute top-0 right-0 w-48 h-48 pointer-events-none opacity-40 z-0">
          <svg viewBox="0 0 200 200" fill="none" stroke="#D1BFA9" strokeWidth="1.5">
            <path d="M200 0 C 140 30, 90 90, 80 180 M 160 20 C 130 50, 120 70, 110 110 M 180 60 C 140 80, 130 110, 130 140" />
            <circle cx="160" cy="20" r="3" fill="#D1BFA9" />
            <circle cx="110" cy="110" r="3" fill="#D1BFA9" />
            <circle cx="180" cy="60" r="3" fill="#D1BFA9" />
          </svg>
        </div>

        {/* TOP BAR (Image 2) */}
        <header className="h-16 px-8 flex items-center justify-between relative z-20">
          {/* Centered Search Bar */}
          <div className="relative w-96 mx-auto">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#A8988A]" />
            <input
              type="text"
              placeholder="Search in your almari..."
              className="w-full pl-11 pr-4 py-2 rounded-full bg-[#F2EBE1] border border-[#E2D6C6] text-xs text-[#3E3127] placeholder-[#A8988A] focus:outline-none focus:ring-1 focus:ring-[#701E2B]/30 shadow-inner"
            />
          </div>

          {/* User Profile & Bell */}
          <div className="flex items-center gap-4 absolute right-8">
            <button className="p-2 text-[#615246] hover:bg-[#E7DCD0] rounded-full relative transition">
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 rounded-full bg-[#701E2B] absolute top-1.5 right-1.5" />
            </button>
            <div className="flex items-center gap-2 cursor-pointer">
              <img src={userAvatar} alt="Maya" className="w-8 h-8 rounded-full object-cover border border-[#C5A059]" />
              <span className="text-xs font-serif font-semibold text-[#3E3127]">{userName}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#615246]" />
            </div>
          </div>
        </header>

        {/* CHAT CONTAINER AREA */}
        <div className="flex-1 overflow-y-auto px-8 pb-6 flex flex-col items-center relative z-10">
          <div className="w-full max-w-4xl flex flex-col h-full">
            {/* Title & Subtitle */}
            <div className="mb-4 text-left">
              <h1 className="font-serif text-3xl font-bold text-[#2C221B]">AI Stylist</h1>
              <p className="text-xs text-[#827164] mt-0.5 font-serif">Ask for outfit ideas, styling tips, and wardrobe help.</p>
            </div>

            {/* CURVY VINTAGE FRAME CONTAINER (Exact Image 2 & 4 Arch) */}
            <div className="flex-1 rounded-[36px] bg-[#FDFBF7] border-2 border-[#EADCCF] p-6 md:p-8 flex flex-col justify-between relative shadow-sm overflow-hidden">
              {/* Top Crown Arch Ornament (SVG Filigree Crest from Image 4) */}
              <div className="w-full flex justify-center mb-2">
                <svg width="220" height="28" viewBox="0 0 220 28" fill="none" stroke="#C9B6A0" strokeWidth="1.2">
                  <path d="M 10 26 Q 50 4, 110 4 Q 170 4, 210 26" />
                  <path d="M 30 26 Q 65 10, 110 10 Q 155 10, 190 26" strokeWidth="0.8" />
                  <circle cx="110" cy="4" r="2.5" fill="#C9B6A0" />
                  <path d="M 105 4 C 105 1, 115 1, 115 4" />
                </svg>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto pr-2 space-y-6">
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
                            <div className="flex flex-wrap gap-2 mt-3">
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
                      /* USER MSG BUBBLE (Image 2 - Muted Salmon/Peach) */
                      <div className="flex items-start justify-end gap-3 self-end max-w-[80%] ml-auto">
                        <div className="flex flex-col items-end">
                          <div className="bg-[#F5DCD3] text-[#3E3127] p-3.5 px-4 rounded-2xl rounded-tr-xs text-xs leading-relaxed shadow-2xs border border-[#E8C5BA]">
                            {msg.text}
                            <span className="flex items-center justify-end gap-1 text-[9px] text-[#8C7A6B] text-right mt-1.5 font-sans">
                              <span>{msg.timestamp}</span>
                              <CheckCheck className="w-3 h-3 text-[#6B1D2F]" />
                            </span>
                          </div>
                        </div>
                        <img src={userAvatar} alt="Maya" className="w-8 h-8 rounded-full object-cover border border-[#C5A059] shrink-0 mt-0.5" />
                      </div>
                    )}
                  </motion.div>
                ))}

                {/* Thinking Indicator */}
                {loading && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#6B1D2F] text-[#FDFBF7] flex items-center justify-center shrink-0 shadow-sm">
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
              <div className="pt-4 border-t border-[#E8DCCF]">
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
                      className="w-8 h-8 rounded-full bg-[#6B1D2F] hover:bg-[#521422] disabled:opacity-40 text-[#FFFDF9] flex items-center justify-center transition shadow-sm"
                    >
                      <Send className="w-3.5 h-3.5 ml-0.5" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-1.5 mt-2.5 text-[10px] text-[#A8988A]">
                  <Lock className="w-3 h-3 text-[#A8988A]" />
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
              className="fixed inset-0 bg-neutral-900/30 backdrop-blur-xs"
            />

            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-sm bg-[#F6F0E6] h-full shadow-2xl z-10 flex flex-col border-r border-[#E2D6C6]"
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