import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, CheckCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';

export default function AuthScreen() {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match");
        }
        const data = await signUp(email, password);

        const needsConfirmation =
          !data.session ||
          data.user?.identities?.length === 0 ||
          !data.user?.email_confirmed_at;

        if (needsConfirmation) {
          setSuccessMessage(
            'Account created! Check your email for a confirmation link, then come back and sign in.'
          );
          setMode('signin');
        } else {
          navigate('/gender-select');
        }
      } else {
        await signIn(email, password);
        navigate('/dashboard');
      }
    } catch (err) {
      const msg = err.message || 'Authentication failed';
      if (msg.toLowerCase().includes('email not confirmed') || msg.toLowerCase().includes('email_not_confirmed')) {
        setError('Your email is not confirmed yet. Please check your inbox (and spam folder) for the confirmation link.');
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary gradient-pastel p-6 relative">
      <div className="absolute inset-0 pattern-dots opacity-30 pointer-events-none"></div>

      <motion.div 
        className="w-full max-w-md z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-white/80 px-4 py-1.5 rounded-full border border-accent-light/60 shadow-soft mb-3">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-xs font-semibold text-text-secondary">Virtual Wardrobe Experience</span>
          </div>
          <h1 className="font-display text-4xl text-gradient font-bold">Almari Adda</h1>
          <p className="text-text-secondary text-sm mt-1">Sign in to access your digital closet</p>
        </div>

        <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-surface-light shadow-medium overflow-hidden">
          <div className="flex border-b border-surface-light">
            <button
              type="button"
              className={`flex-1 py-4 text-sm font-semibold transition-colors relative ${mode === 'signin' ? 'text-accent-hover' : 'text-text-muted hover:text-text-secondary'}`}
              onClick={() => { setMode('signin'); setError(''); }}
            >
              Sign In
              {mode === 'signin' && (
                <motion.div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" layoutId="tab-indicator" />
              )}
            </button>
            <button
              type="button"
              className={`flex-1 py-4 text-sm font-semibold transition-colors relative ${mode === 'signup' ? 'text-accent-hover' : 'text-text-muted hover:text-text-secondary'}`}
              onClick={() => { setMode('signup'); setError(''); }}
            >
              Sign Up
              {mode === 'signup' && (
                <motion.div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" layoutId="tab-indicator" />
              )}
            </button>
          </div>

          <div className="p-6 md:p-8">
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-pastel-sage border border-success/30 text-success rounded-2xl text-sm text-center flex flex-col items-center gap-2"
              >
                <CheckCircle className="w-5 h-5 text-success" />
                {successMessage}
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-error/10 border border-error/20 text-error rounded-2xl text-sm text-center flex flex-col items-center gap-2"
              >
                <Mail className="w-5 h-5 text-error" />
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="email"
                label="Email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                type="password"
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              
              <AnimatePresence mode="popLayout">
                {mode === 'signup' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Input
                      type="password"
                      label="Confirm Password"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="pt-2">
                <Button 
                  type="submit" 
                  variant="primary" 
                  fullWidth 
                  disabled={isLoading}
                  className="gradient-accent text-white font-semibold py-3 shadow-soft"
                >
                  {isLoading ? 'Loading...' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
                </Button>
              </div>
            </form>

            <div className="mt-6 text-center text-sm text-text-secondary">
              {mode === 'signin' ? (
                <p>Don't have an account? <button type="button" onClick={() => { setMode('signup'); setError(''); setSuccessMessage(''); }} className="text-accent font-semibold hover:underline transition-colors">Sign Up</button></p>
              ) : (
                <p>Already have an account? <button type="button" onClick={() => { setMode('signin'); setError(''); setSuccessMessage(''); }} className="text-accent font-semibold hover:underline transition-colors">Sign In</button></p>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
