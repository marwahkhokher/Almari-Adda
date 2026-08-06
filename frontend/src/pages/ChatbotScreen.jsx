import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Paperclip,
  Send,
  History,
  Plus,
  MessageSquare,
  X,
  Lock,
  CheckCheck,
  CloudUpload,
  Home,
  Menu,
  User,
  Wand2,
  RotateCcw,
  Shirt,
  Check,
} from 'lucide-react';
import Sidebar from '../components/Sidebar2.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import ProfileDrawer from './ProfileScreen.jsx';
import {
  sendChatMessage,
  getUserChatSessions,
  getChatSessionHistory,
  incrementTimesWorn,
} from '../lib/api.js';

function Hanger({ className, ...props }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
      <path d="M12 5.5C12 3.8 13.3 2.5 15 2.5C16.7 2.5 18 3.8 18 5.5C18 7.2 16.5 8 15.5 8.8L12 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 11L3 17.5C2.4 18 2.8 19 3.6 19H20.4C21.2 19 21.6 18 21 17.5L12 11Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

const NAV_ITEMS = [
  { label: 'Closet', icon: Home, action: 'closet' },
  { label: 'Visualizer', icon: Sparkles, route: '/visualize' },
  { label: 'Upload Item', icon: CloudUpload, route: '/upload' },
  { label: 'Build Outfit', icon: Hanger, route: '/build-outfit' },
  { label: 'Stylist AI', icon: Wand2, route: '/chatbot' },
];

export default function ChatbotScreen() {
  const navigate = useNavigate();
  const auth = useAuth() || {};
  const { user, signOut } = auth;
  const userId = user?.id || user?.email || 'anonymous_user';

  const rawName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Guest';
  const userName = rawName.split(' ')[0];
  const userAvatar = user?.user_metadata?.avatar_url || null;
  const userInitial = userName?.[0]?.toUpperCase() || 'U';

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  const handleNavItem = (navItem) => {
    setIsMobileSidebarOpen(false);
    if (navItem.route) {
      navigate(navItem.route);
      return;
    }
    if (navItem.action === 'closet' || navItem.action === 'favorites') {
      navigate('/dashboard');
    }
  };

  const [sessionId, setSessionId] = useState('');
  const [sessionTitle, setSessionTitle] = useState('New Conversation');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const messagesEndRef = useRef(null);

  // Tracks which outfit cards have already been logged as "worn" so
  // the button can show a confirmed state and prevent double-clicks.
  const [wornOutfitIds, setWornOutfitIds] = useState(new Set());
  const [wearingOutfitId, setWearingOutfitId] = useState(null);

  const initialMessage = {
    id: 'welcome',
    text: `Good evening, ${userName}! ✨\nI'm your AI stylist, here to help you look and feel your best.\nWhat are we dressing for today?`,
    isUser: false,
    timestamp: '6:45 PM',
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
    const sid = crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
    setSessionId(sid);
    loadUserSessions();
  }, [userId]);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 50);
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (customMessage = null, excludedKeys = []) => {
    const messageText = customMessage || input;
    if (!messageText.trim() || loading) return;

    const userMessage = {
      id: Date.now().toString(),
      text: messageText,
      isUser: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!customMessage) setInput('');
    setLoading(true);

    try {
      const response = await sendChatMessage(sessionId, messageText, userId, excludedKeys);
      if (response.title) setSessionTitle(response.title);
      loadUserSessions();

      const botMessage = {
        id: (Date.now() + 1).toString(),
        text: response.reply || "I've put together some great options from your almari!",
        isUser: false,
        outfitSuggestions: response.outfit_suggestions || [],
        imageUrls: response.image_urls || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: "Sorry, I couldn't reach the stylist engine right now. Please make sure the backend server is running.",
          isUser: false,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
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
    const newSid = crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
    setSessionId(newSid);
    setSessionTitle('New Conversation');
    setMessages([{ ...initialMessage, id: Date.now().toString() }]);
    setIsHistoryOpen(false);
  };

  const handleWearOutfit = async (outfit, outfitKey) => {
    const itemIds = (outfit.items || []).map((i) => i.id).filter(Boolean);
    if (itemIds.length === 0 || wornOutfitIds.has(outfitKey)) return;

    setWearingOutfitId(outfitKey);
    try {
      await incrementTimesWorn(itemIds);
      setWornOutfitIds((prev) => new Set(prev).add(outfitKey));
    } catch (e) {
      console.error('Failed to log worn outfit', e);
      alert('Could not log this outfit as worn. Please check your connection and try again.');
    } finally {
      setWearingOutfitId(null);
    }
  };

  const handleRegenerate = (originalPrompt) => {
    const previousOutfitKeys = messages
      .flatMap((msg) => msg.outfitSuggestions || [])
      .map((outfit) => {
        const items = outfit.items || [];
        const topItem = items.find((i) => (i.category || '').toLowerCase() === 'top' || (i.category || '').toLowerCase() === 'outerwear') || items[0];
        const bottomItem = items.find((i) => (i.category || '').toLowerCase() === 'bottom') || items[1];
        const topId = topItem?.id || '';
        const bottomId = bottomItem?.id || '';
        return `${topId}:${bottomId}`;
      })
      .filter((k) => k !== ':');

    const basePrompt = originalPrompt.replace(/\s*\([^)]*different[^)]*\)/gi, '').trim();

    handleSend(`${basePrompt} (suggest something different this time)`, previousOutfitKeys);
  };

  const presetChips = [
    { label: 'Dinner date', icon: '🍽️' },
    { label: 'Casual day out', icon: '☀️' },
    { label: 'Office look', icon: '💼' },
    { label: 'Weekend brunch', icon: '☕' },
  ];

  return (
    <div className="min-h-screen bg-[#FBF3E7]">
      {/* MOBILE TOP BAR */}
      <div className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-[#e6d5b8] bg-[#FBF3E7]/95 px-4 backdrop-blur lg:hidden">
        <button type="button" onClick={() => setIsMobileSidebarOpen(true)} className="rounded-full p-2 text-[#3d2417]" aria-label="Open menu">
          <Menu size={22} />
        </button>
        <div className="font-serif text-lg font-semibold tracking-[0.14em] text-[#7a2331]">ALMARI ADDA</div>
        <button type="button" onClick={() => setIsProfileOpen(true)} className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-[#e6d5b8] bg-white">
          {userAvatar ? <img src={userAvatar} alt={userName} className="h-full w-full object-cover" /> : <User size={17} />}
        </button>
      </div>

      {/* MOBILE SIDEBAR */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileSidebarOpen(false)}
              className="fixed inset-0 z-[70] bg-black/40 lg:hidden"
              aria-label="Close menu"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="fixed bottom-0 left-0 top-0 z-[80] w-[260px] max-w-[88vw] lg:hidden"
            >
              <Sidebar navItems={NAV_ITEMS} onNavigate={handleNavItem} onSignOut={handleSignOut} onClose={() => setIsMobileSidebarOpen(false)} mobile />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* DESKTOP SIDEBAR */}
      <aside className="fixed bottom-0 left-0 top-0 z-40 hidden w-[260px] lg:block">
        <Sidebar navItems={NAV_ITEMS} onNavigate={handleNavItem} onSignOut={handleSignOut} />
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex min-h-screen flex-col pt-16 lg:ml-[260px] lg:pt-0">
        <main className="flex-1 px-4 md:px-10 py-8 max-w-[1440px] w-full mx-auto flex flex-col">
          <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 mb-8">
            <div className="hidden md:block" />

            <div className="text-center">
              <h1 className="text-3xl md:text-4xl font-display font-bold text-[#3d2417]">
                AI <span className="text-[#7a2331]">Stylist</span>
              </h1>
              <div className="flex items-center justify-center gap-2 mt-2.5 mb-2">
                <span className="w-8 h-px bg-[#c9a769]" />
                <span className="w-1.5 h-1.5 rotate-45 bg-[#c9a769]" />
                <span className="w-8 h-px bg-[#c9a769]" />
              </div>
              <p className="text-[#8a7360] text-sm">Ask for outfit ideas, styling tips, and wardrobe help.</p>
            </div>

            <div className="flex items-center justify-center md:justify-end gap-3">
              <button
                onClick={() => setIsHistoryOpen(true)}
                className="inline-flex items-center gap-2 text-[#7a2331] border border-[#7a2331]/30 hover:bg-[#7a2331]/5 text-sm font-semibold px-4 py-2 rounded-xl transition"
              >
                <History className="w-4 h-4" />
                History ({sessions.length})
              </button>
              <button
                onClick={() => setIsProfileOpen(true)}
                aria-label="Profile"
                className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-[#e6d5b8] hover:bg-[#f3e6cf] text-[#3d2417] transition"
              >
                <User className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* CHAT CARD */}
          <div className="flex-1 bg-[#FCF6EC] rounded-3xl border border-[#e6d5b8] shadow-[0_8px_30px_rgba(61,36,23,0.08)] p-4 md:p-6 flex flex-col min-h-[550px]">
            <div className="flex-1 space-y-6 overflow-y-auto pr-2 pb-2 pt-2">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col space-y-3"
                >
                  {!msg.isUser ? (
                    <div className="flex max-w-[85%] items-start gap-3.5">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#7a2331] text-white shadow-sm">
                        <Sparkles className="h-4 w-4 text-[#f3d7a4]" />
                      </div>
                      <div className="flex flex-col">
                        <span className="mb-1 text-sm font-bold text-[#7a2331]">AI Stylist</span>
                        <div className="relative whitespace-pre-line rounded-2xl rounded-tl-sm border border-[#e6d5b8] bg-white p-4 text-base font-medium leading-relaxed text-[#3d2417] shadow-sm">
                          {msg.text}
                          <span className="mt-2 block text-right text-xs text-[#a89478]">{msg.timestamp}</span>
                        </div>

                        {msg.id === 'welcome' && (
                          <div className="mt-3 flex flex-wrap gap-2.5">
                            {presetChips.map((chip) => (
                              <button
                                key={chip.label}
                                onClick={() => handleSend(`Can you suggest a ${chip.label.toLowerCase()} outfit?`)}
                                className="flex items-center gap-2 rounded-xl border border-[#e6d5b8] bg-white px-4 py-2 text-sm text-[#6b5645] shadow-sm transition hover:border-[#7a2331]/40 hover:text-[#7a2331]"
                              >
                                <span>{chip.icon}</span>
                                <span>{chip.label}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {msg.outfitSuggestions && msg.outfitSuggestions.length > 0 && (
                          <div className="mt-3 space-y-3">
                            {msg.outfitSuggestions.map((outfit, idx) => {
                              const outfitKey = `${msg.id}-${idx}`;
                              const isWorn = wornOutfitIds.has(outfitKey);
                              const isWearing = wearingOutfitId === outfitKey;
                              return (
                                <div key={idx} className="rounded-2xl border border-[#e6d5b8] bg-white p-4 shadow-sm">
                                  <span className="mb-2 block text-sm font-bold text-[#7a2331]">Suggested Outfit</span>
                                  <div className="flex gap-3 overflow-x-auto pb-2">
                                    {outfit.items?.map((item, i) => (
                                      <div key={i} className="flex w-20 shrink-0 flex-col items-center rounded-xl border border-[#e6d5b8] bg-[#FCF6EC] p-2">
                                        <img src={item.image_url} alt={item.category} className="mb-1 h-16 w-14 object-contain" />
                                        <span className="w-full truncate text-center text-xs font-medium text-[#6b5645]">
                                          {item.subcategory || item.category}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                  <p className="mt-2 rounded-xl border border-[#e6d5b8] bg-[#FCF6EC] p-2.5 text-sm leading-relaxed text-[#6b5645]">
                                    {outfit.reasoning}
                                  </p>
                                  <div className="flex gap-2 mt-3">
                                    <button
                                      onClick={() => handleRegenerate(msg.text)}
                                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-[#7a2331]/30 text-[#7a2331] text-xs font-semibold py-2 hover:bg-[#7a2331]/5 transition"
                                    >
                                      <RotateCcw className="w-3.5 h-3.5" />
                                      Regenerate
                                    </button>
                                    <button
                                      onClick={() => handleWearOutfit(outfit, outfitKey)}
                                      disabled={isWorn || isWearing}
                                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-[#7a2331] text-white text-xs font-semibold py-2 hover:bg-[#631b28] transition disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                      {isWorn ? (
                                        <>
                                          <Check className="w-3.5 h-3.5" />
                                          Worn
                                        </>
                                      ) : isWearing ? (
                                        <>Logging...</>
                                      ) : (
                                        <>
                                          <Shirt className="w-3.5 h-3.5" />
                                          Wear Outfit
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="ml-auto flex max-w-[80%] items-start justify-end gap-3 self-end">
                      <div className="flex flex-col items-end">
                        <div className="rounded-2xl rounded-tr-sm border border-[#7a2331]/20 bg-[#7a2331]/10 p-3.5 px-4 text-base font-medium leading-relaxed text-[#3d2417] shadow-sm">
                          {msg.text}
                          <span className="mt-1.5 flex items-center justify-end gap-1 text-right text-xs text-[#8a7360]">
                            <span>{msg.timestamp}</span>
                            <CheckCheck className="h-3.5 w-3.5 text-[#7a2331]" />
                          </span>
                        </div>
                      </div>
                      {userAvatar ? (
                        <img src={userAvatar} alt={userName} className="mt-0.5 h-8 w-8 shrink-0 rounded-full border border-[#c9a769] object-cover" />
                      ) : (
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#c9a769] bg-[#7a2331] text-xs font-bold text-white">
                          {userInitial}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}

              {loading && (
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#7a2331] text-white shadow-sm">
                    <Sparkles className="h-4 w-4 text-[#f3d7a4]" />
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl border border-[#e6d5b8] bg-white p-3.5 text-sm font-medium text-[#8a7360]">
                    <span className="h-2 w-2 animate-ping rounded-full bg-[#7a2331]" />
                    <span>Styling your outfit...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-[#e6d5b8] pt-3 mt-3">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask your stylist anything..."
                  className="w-full rounded-full border border-[#e6d5b8] bg-[#FFFDF9] py-3.5 pl-6 pr-24 text-base text-[#3d2417] shadow-inner placeholder:text-[#a89478] focus:outline-none focus:ring-2 focus:ring-[#7a2331]/20 focus:border-[#7a2331]"
                />
                <div className="absolute right-3 flex items-center gap-2">
                  <button className="p-1.5 text-[#a89478] transition hover:text-[#7a2331]">
                    <Paperclip className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleSend()}
                    disabled={!input.trim() || loading}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[#7a2331] text-white shadow-sm transition hover:bg-[#631b28] disabled:opacity-40"
                  >
                    <Send className="ml-0.5 h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="mt-2.5 flex items-center justify-center gap-1.5 text-xs text-[#a89478]">
                <Lock className="h-3 w-3 text-[#a89478]" />
                <span>Your conversations are private and secure</span>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* HISTORY DRAWER */}
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
              className="relative z-50 flex h-full w-full max-w-sm flex-col border-r border-[#e6d5b8] bg-[#FCF6EC] shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-[#e6d5b8] bg-[#f3e6cf] p-4">
                <div className="flex items-center gap-2">
                  <History className="h-5 w-5 text-[#7a2331]" />
                  <span className="text-base font-bold text-[#3d2417]">Your Conversations</span>
                </div>
                <button onClick={() => setIsHistoryOpen(false)} className="rounded-full p-1.5 text-[#8a7360] hover:bg-[#ebdbc0] hover:text-[#3d2417]">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="border-b border-[#e6d5b8] p-3">
                <button
                  onClick={handleNewChat}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#7a2331] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#631b28]"
                >
                  <Plus className="h-4 w-4" />
                  <span>Start New Conversation</span>
                </button>
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto p-3">
                {sessions.length === 0 ? (
                  <div className="flex h-48 flex-col items-center justify-center p-4 text-center">
                    <MessageSquare className="mb-2 h-8 w-8 text-[#a89478]" />
                    <p className="text-sm font-medium text-[#6b5645]">No previous conversations yet.</p>
                    <p className="mt-1 text-xs text-[#8a7360]">Start chatting with the AI stylist to save history!</p>
                  </div>
                ) : (
                  sessions.map((s) => {
                    const isActive = s.id === sessionId;
                    return (
                      <button
                        key={s.id}
                        onClick={() => handleSelectSession(s)}
                        className={`flex w-full flex-col gap-1 rounded-xl border p-3 text-left transition-all ${
                          isActive ? 'border-[#7a2331]/30 bg-[#7a2331]/10 shadow-sm' : 'border-[#e6d5b8] bg-white hover:border-[#7a2331]/30 hover:bg-[#f3e6cf]/50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className={`truncate text-sm font-bold ${isActive ? 'text-[#7a2331]' : 'text-[#3d2417]'}`}>
                            {s.title || 'Styling Conversation'}
                          </span>
                          {isActive && <span className="h-2 w-2 shrink-0 rounded-full bg-[#7a2331]" />}
                        </div>
                        <span className="text-xs font-medium text-[#8a7360]">
                          {s.updated_at
                            ? new Date(s.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                            : ''}
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

      <ProfileDrawer isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </div>
  );
}