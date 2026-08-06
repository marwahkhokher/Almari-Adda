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
  CheckCheck,
  CloudUpload,
  Heart,
  Home,
  Menu,
  User,
  Wand2,
} from 'lucide-react';
import Sidebar from '../components/Sidebar2.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import ProfileDrawer from './ProfileScreen.jsx';
import {
  sendChatMessage,
  getUserChatSessions,
  getChatSessionHistory,
} from '../lib/api.js';

function Hanger() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 5.5C12 3.8 13.3 2.5 15 2.5C16.7 2.5 18 3.8 18 5.5C18 7.2 16.5 8 15.5 8.8L12 11"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M12 11L3 17.5C2.4 18 2.8 19 3.6 19H20.4C21.2 19 21.6 18 21 17.5L12 11Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const NAV_ITEMS = [
  { label: 'Closet', icon: Home, action: 'closet' },
  { label: 'Visualizer', icon: Sparkles, route: '/visualize' },
  { label: 'Upload Item', icon: CloudUpload, route: '/upload' },
  { label: 'Build Outfit', icon: Hanger, route: '/build-outfit' },
  { label: 'Stylist AI', icon: Wand2, route: '/chatbot' },
  { label: 'Favorites', icon: Heart, action: 'favorites' },
];

export default function ChatbotScreen() {
  const navigate = useNavigate();
  const auth = useAuth() || {};
  const { user, signOut } = auth;
  const userId = user?.id || user?.email || 'anonymous_user';

  const rawName =
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Guest';
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
          block: 'end',
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
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
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
        text:
          response.reply ||
          "I've put together some great options from your almari!",
        isUser: false,
        outfitSuggestions: response.outfit_suggestions || [],
        imageUrls: response.image_urls || [],
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: "Sorry, I couldn't reach the stylist engine right now. Please make sure the backend server is running.",
          isUser: false,
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
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
          const image_urls = suggestions.flatMap((s) =>
            (s.items || []).map((i) => i.image_url),
          );
          return {
            id: m.id,
            text: m.message,
            isUser: m.sender === 'user',
            outfitSuggestions: suggestions,
            imageUrls: image_urls,
            timestamp: new Date(m.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
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
    <div className="min-h-screen w-screen overflow-hidden bg-[#F7F1E8] font-serif text-[#3D2417] select-none">
      <div className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-[#E6D5B8] bg-[#F9F4EC]/95 px-4 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setIsMobileSidebarOpen(true)}
          className="rounded-full p-2 text-[#3D2417]"
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>

        <div className="font-serif text-lg font-semibold tracking-[0.14em] text-[#7A2331]">
          ALMARI ADDA
        </div>

        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-[#D6C5B4] bg-white"
        >
          {userAvatar ? (
            <img
              src={userAvatar}
              alt={userName}
              className="h-full w-full object-cover"
            />
          ) : (
            <User size={17} />
          )}
        </button>
      </div>

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
              <Sidebar
                navItems={NAV_ITEMS}
                onNavigate={handleNavItem}
                onSignOut={handleSignOut}
                onClose={() => setIsMobileSidebarOpen(false)}
                mobile
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <aside className="fixed bottom-0 left-0 top-0 z-40 hidden w-[260px] lg:block">
        <Sidebar
          navItems={NAV_ITEMS}
          onNavigate={handleNavItem}
          onSignOut={handleSignOut}
        />
      </aside>

      <img
        src="/bg.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 h-screen w-screen object-cover lg:left-[260px] lg:w-[calc(100vw-260px)]"
      />

      <main className="relative z-10 h-screen overflow-hidden pt-16 lg:ml-[260px] lg:pt-0">

        <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col px-5 pb-5 pt-4 md:px-6 lg:pb-6 lg:pt-4">
          <header className="relative z-20 mb-2 flex h-14 shrink-0 items-center justify-between px-2">
            <div className="hidden w-32 md:block" />

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsHistoryOpen(true)}
                className="flex items-center gap-1.5 rounded-full border border-[#E6D5B8] bg-[#F3E6CF] px-3.5 py-1.5 text-xs font-semibold text-[#7A2331] shadow-xs transition hover:bg-[#EBDBC0]"
                title="Chat History"
              >
                <History className="h-3.5 w-3.5" />
                <span>History ({sessions.length})</span>
              </button>

              <button
  type="button"
  onClick={() => setIsProfileOpen(true)}
  aria-label="Profile"
  className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#d5bda5] bg-[#dbc3aa] shadow-sm transition hover:bg-[#d3b89c]"
>
  <User size={18} className="text-[#4d382d]" />
</button>
            </div>
          </header>

          <motion.div
            className="mt-12 mb-5 shrink-0 text-center"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h1 className="mb-1 font-serif text-4xl font-bold tracking-tight text-[#33231c] md:text-5xl">
              AI Stylist
            </h1>
            <p className="font-sans text-sm text-[#75655a]">
              Ask for outfit ideas, styling tips, and wardrobe help.
            </p>
          </motion.div>

          <div className="relative flex min-h-0 h-[550px] flex-col overflow-hidden rounded-3xl border border-[#EADCCF] bg-[#FFFDF9] p-6 shadow-sm md:p-8">
            <div className="flex-1 space-y-6 overflow-y-auto pb-2 pr-2 pt-2">
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
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#7A2331] text-[#FDFBF7] shadow-sm">
                        <Sparkles className="h-4 w-4 text-[#F3D7A4]" />
                      </div>
                      <div className="flex flex-col">
                        <span className="mb-1 text-sm font-bold text-[#7A2331]">
                          AI Stylist
                        </span>
                        <div className="relative whitespace-pre-line rounded-2xl rounded-tl-xs border border-[#E8DCCF] bg-[#FBF8F3] p-4 text-base font-medium leading-relaxed text-[#3D2417] shadow-2xs">
                          {msg.text}
                          <span className="mt-2 block text-right font-sans text-[10px] text-[#A89478]">
                            {msg.timestamp}
                          </span>
                        </div>

                        {msg.id === 'welcome' && (
                          <div className="mt-3 flex flex-wrap gap-2.5">
                            {presetChips.map((chip) => (
                              <button
                                key={chip.label}
                                onClick={() =>
                                  handleSend(
                                    `Can you suggest a ${chip.label.toLowerCase()} outfit?`,
                                  )
                                }
                                className="flex items-center gap-2 rounded-xl border border-[#E8DCCF] bg-[#FDFBF7] px-4 py-2 text-xs text-[#6B5645] shadow-2xs transition hover:border-[#7A2331]/40 hover:text-[#7A2331]"
                              >
                                <span>{chip.icon}</span>
                                <span>{chip.label}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {msg.outfitSuggestions &&
                          msg.outfitSuggestions.length > 0 && (
                            <div className="mt-3 space-y-3">
                              {msg.outfitSuggestions.map((outfit, idx) => (
                                <div
                                  key={idx}
                                  className="rounded-2xl border border-[#E8DCCF] bg-[#FBF8F3] p-4 shadow-2xs"
                                >
                                  <span className="mb-2 block text-sm font-bold text-[#7A2331]">
                                    Suggested Outfit
                                  </span>
                                  <div className="flex gap-3 overflow-x-auto pb-2">
                                    {outfit.items?.map((item, i) => (
                                      <div
                                        key={i}
                                        className="flex w-20 shrink-0 flex-col items-center rounded-xl border border-[#E6D5B8] bg-[#F9F3EA] p-2"
                                      >
                                        <img
                                          src={item.image_url}
                                          alt={item.category}
                                          className="mb-1 h-16 w-14 object-contain"
                                        />
                                        <span className="w-full truncate text-center text-[10px] font-medium text-[#6B5645]">
                                          {item.subcategory || item.category}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                  <p className="mt-2 rounded-xl border border-[#E6D5B8] bg-[#F9F3EA] p-2.5 text-sm leading-relaxed text-[#6B5645]">
                                    {outfit.reasoning}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                      </div>
                    </div>
                  ) : (
                    <div className="ml-auto flex max-w-[80%] items-start justify-end gap-3 self-end">
                      <div className="flex flex-col items-end">
                        <div className="rounded-2xl rounded-tr-xs border border-[#E8C5BA] bg-[#F5DCD3] p-3.5 px-4 text-base font-medium leading-relaxed text-[#3D2417] shadow-2xs">
                          {msg.text}
                          <span className="mt-1.5 flex items-center justify-end gap-1 text-right font-sans text-[9px] text-[#8A7360]">
                            <span>{msg.timestamp}</span>
                            <CheckCheck className="h-3.5 w-3.5 text-[#7A2331]" />
                          </span>
                        </div>
                      </div>
                      {userAvatar ? (
                        <img
                          src={userAvatar}
                          alt={userName}
                          className="mt-0.5 h-8.5 w-8.5 shrink-0 rounded-full border border-[#C9A769] object-cover"
                        />
                      ) : (
                        <div className="mt-0.5 flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-full border border-[#C9A769] bg-[#7A2331] text-xs font-bold text-[#FFFDF9]">
                          {userInitial}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}

              {loading && (
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#7A2331] text-[#FDFBF7] shadow-sm">
                    <Sparkles className="h-4 w-4 text-[#F3D7A4]" />
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl border border-[#E8DCCF] bg-[#FBF8F3] p-3.5 text-xs font-medium text-[#8A7360]">
                    <span className="h-2 w-2 animate-ping rounded-full bg-[#7A2331]" />
                    <span>Styling your outfit...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-[#E8DCCF] pt-3">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask your stylist anything..."
                  className="w-full rounded-full border border-[#E8DCCF] bg-[#FFFDF9] py-3.5 pl-6 pr-24 text-base text-[#3D2417] shadow-inner placeholder:text-[#A89478] focus:outline-none focus:ring-1 focus:ring-[#7A2331]/40"
                />
                <div className="absolute right-3 flex items-center gap-2">
                  <button className="p-1.5 text-[#A89478] transition hover:text-[#7A2331]">
                    <Paperclip className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleSend()}
                    disabled={!input.trim() || loading}
                    className="flex h-8.5 w-8.5 items-center justify-center rounded-full bg-[#7A2331] text-[#FFFDF9] shadow-sm transition hover:bg-[#5E1B26] disabled:opacity-40"
                  >
                    <Send className="ml-0.5 h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[10px] text-[#A89478]">
                <Lock className="h-3 w-3 text-[#A89478]" />
                <span>Your conversations are private and secure</span>
              </div>
            </div>
          </div>
        </div>
      </main>

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
              className="relative z-50 flex h-full w-full max-w-sm flex-col border-r border-[#E6D5B8] bg-[#F9F3EA] shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-[#E6D5B8] bg-[#F3E6CF] p-4">
                <div className="flex items-center gap-2">
                  <History className="h-5 w-5 text-[#7A2331]" />
                  <span className="text-base font-bold text-[#3D2417]">
                    Your Conversations
                  </span>
                </div>
                <button
                  onClick={() => setIsHistoryOpen(false)}
                  className="rounded-full p-1.5 text-[#8A7360] hover:bg-[#EBDBC0] hover:text-[#3D2417]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="border-b border-[#E6D5B8] p-3">
                <button
                  onClick={handleNewChat}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#7A2331] px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#5E1B26]"
                >
                  <Plus className="h-4 w-4" />
                  <span>Start New Conversation</span>
                </button>
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto p-3">
                {sessions.length === 0 ? (
                  <div className="flex h-48 flex-col items-center justify-center p-4 text-center">
                    <MessageSquare className="mb-2 h-8 w-8 text-[#A89478]" />
                    <p className="text-xs font-medium text-[#6B5645]">
                      No previous conversations yet.
                    </p>
                    <p className="mt-1 text-[11px] text-[#8A7360]">
                      Start chatting with the AI stylist to save history!
                    </p>
                  </div>
                ) : (
                  sessions.map((s) => {
                    const isActive = s.id === sessionId;
                    return (
                      <button
                        key={s.id}
                        onClick={() => handleSelectSession(s)}
                        className={`flex w-full flex-col gap-1 rounded-xl border p-3 text-left transition-all ${
                          isActive
                            ? 'border-[#E8C5BA] bg-[#7a2331]/10 shadow-xs'
                            : 'border-[#E6D5B8] bg-[#FFFDF9] hover:border-[#7A2331]/30 hover:bg-[#F3E6CF]/50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`truncate text-xs font-bold ${
                              isActive ? 'text-[#7A2331]' : 'text-[#3D2417]'
                            }`}
                          >
                            {s.title || 'Styling Conversation'}
                          </span>
                          {isActive && (
                            <span className="h-2 w-2 shrink-0 rounded-full bg-[#7A2331]" />
                          )}
                        </div>
                        <span className="text-[10px] font-medium text-[#8A7360]">
                          {s.updated_at
                            ? new Date(s.updated_at).toLocaleDateString(
                                undefined,
                                {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                },
                              )
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

      <ProfileDrawer
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </div>
  );
}