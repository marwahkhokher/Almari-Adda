import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';

const BG_PATTERN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Cg transform='rotate(-10 100 100)' fill='none' stroke='%23D4537E' stroke-width='2'%3E%3Cpath d='M28 18l-8 6-8-6-8 6v8l8-2v22h16V26l8 2v-8z'/%3E%3Cg transform='translate(90 10)'%3E%3Cpath d='M2 2h26v14l-6 2v50h-6V34l-2 2-2-2v34h-6V18l-6-2z'/%3E%3C/g%3E%3Cg transform='translate(20 100)'%3E%3Cpath d='M2 20c0-10 8-18 18-18s18 8 18 18H2z'/%3E%3Cellipse cx='20' cy='20' rx='24' ry='4'/%3E%3C/g%3E%3Cg transform='translate(110 105)'%3E%3Ccircle cx='8' cy='10' r='8'/%3E%3Ccircle cx='32' cy='10' r='8'/%3E%3Cpath d='M16 10h8M0 8l-6-4M40 8l6-4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")";

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
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

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
        const data = await signUp(
          email,
          password,
          firstName,
          lastName
        );

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
          navigate('/dashboard');
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
    <div className="min-h-screen flex items-center justify-center bg-white p-6 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.22]"
        style={{
          backgroundImage: BG_PATTERN,
          backgroundSize: '200px 200px',
        }}
      />
      <motion.div
        className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-bold text-neutral-900">Almari Adda</h1>
          <p className="text-neutral-700 text-sm font-medium mt-2">Sign in to access your digital closet</p>
        </div>

        <div className="bg-white rounded-2xl border-2 border-pink-600 overflow-hidden">
          <div className="flex border-b border-neutral-200">
            <button
              type="button"
              className={`flex-1 py-4 text-sm font-medium transition-colors relative ${mode === 'signin' ? 'text-pink-600' : 'text-neutral-400 hover:text-neutral-600'}`}
              onClick={() => { setMode('signin'); setError(''); }}
            >
              Sign in
              {mode === 'signin' && (
                <motion.div className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-600" layoutId="tab-indicator" />
              )}
            </button>
            <button
              type="button"
              className={`flex-1 py-4 text-sm font-medium transition-colors relative ${mode === 'signup' ? 'text-pink-600' : 'text-neutral-400 hover:text-neutral-600'}`}
              onClick={() => { setMode('signup'); setError(''); }}
            >
              Sign up
              {mode === 'signup' && (
                <motion.div className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-600" layoutId="tab-indicator" />
              )}
            </button>
          </div>

          <div className="p-6 md:p-8">
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-pink-50 border border-pink-200 text-pink-800 rounded-xl text-sm text-center flex flex-col items-center gap-2"
              >
                <CheckCircle className="w-5 h-5 text-pink-600" />
                {successMessage}
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm text-center flex flex-col items-center gap-2"
              >
                <Mail className="w-5 h-5 text-red-600" />
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    First name
                  </label>

                  <input
                    type="text"
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="w-full border border-neutral-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Last name
                  </label>

                  <input
                    type="text"
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="w-full border border-neutral-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  />
                </div>
              </div>
            )}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Email</label>
                <input
                  type="email"
                  placeholder="name@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full border border-neutral-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full border border-neutral-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                />
              </div>

              <AnimatePresence mode="popLayout">
                {mode === 'signup' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">Confirm password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full border border-neutral-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-pink-600 text-white font-medium text-sm py-3 rounded-lg hover:bg-pink-700 transition disabled:opacity-60"
              >
                {isLoading ? 'Loading...' : mode === 'signin' ? 'Sign in' : 'Sign up'}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-neutral-500">
              {mode === 'signin' ? (
                <p>Don't have an account? <button type="button" onClick={() => { setMode('signup'); setError(''); setSuccessMessage(''); }} className="text-pink-600 font-medium hover:underline">Sign up</button></p>
              ) : (
                <p>Already have an account? <button type="button" onClick={() => { setMode('signin'); setError(''); setSuccessMessage(''); }} className="text-pink-600 font-medium hover:underline">Sign in</button></p>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
