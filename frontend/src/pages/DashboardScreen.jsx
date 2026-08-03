import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, Sparkles, ShoppingBag, Camera, MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function DashboardScreen() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  const username = user?.email ? user.email.split('@')[0] : 'Stylist';

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12
      }
    }
  };

  const tileVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
  };

  const tiles = [
    {
      title: "Visualize",
      description: "Try on outfits virtually",
      icon: Sparkles,
      route: "/visualize",
      color: "bg-pastel-pink text-accent-hover"
    },
    {
      title: "See Wardrobe",
      description: "Browse your closet",
      icon: ShoppingBag,
      route: "/closet",
      color: "bg-pastel-blue text-blue-700"
    },
    {
      title: "Upload Wardrobe",
      description: "Add new clothing items",
      icon: Camera,
      route: "/upload",
      color: "bg-pastel-lavender text-purple-700"
    },
    {
      title: "Chatbot",
      description: "Get AI styling advice",
      icon: MessageCircle,
      route: "/chatbot",
      color: "bg-pastel-sage text-success"
    }
  ];

  return (
    <div className="min-h-screen bg-primary gradient-pastel relative">
      <div className="absolute inset-0 pattern-dots opacity-30 pointer-events-none"></div>

      <div className="max-w-4xl mx-auto p-6 md:p-8 lg:p-12 z-10 relative">
        {/* Header */}
        <header className="flex justify-between items-center mb-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Welcome to your closet</span>
            <h1 className="font-display text-3xl md:text-4xl text-text-primary capitalize font-bold mt-0.5">
              Hello, <span className="text-gradient">{username}</span>
            </h1>
          </motion.div>
          
          <motion.button
            onClick={handleSignOut}
            className="p-3 text-text-secondary hover:text-accent transition-colors rounded-full bg-white/80 border border-surface-light shadow-soft hover:bg-white"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            title="Sign Out"
          >
            <LogOut size={20} />
          </motion.button>
        </header>

        {/* Tiles Grid */}
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {tiles.map((tile, index) => (
            <motion.div key={index} variants={tileVariants}>
              <div 
                className="group cursor-pointer rounded-3xl p-6 md:p-8 h-full transition-all duration-300 relative overflow-hidden bg-white/90 border border-surface-light shadow-soft hover:shadow-medium hover:scale-[1.015]"
                onClick={() => navigate(tile.route)}
              >
                <div className="relative z-10 flex flex-col h-full justify-between gap-8">
                  <div className={`w-fit p-4 rounded-2xl ${tile.color} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                    <tile.icon size={28} strokeWidth={1.75} />
                  </div>
                  
                  <div>
                    <h2 className="font-display text-2xl font-bold text-text-primary mb-1 group-hover:text-accent transition-colors">
                      {tile.title}
                    </h2>
                    <p className="text-sm text-text-secondary">{tile.description}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
