import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function AuthScreen() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();

  const [mode, setMode] = useState('signin');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isLoading) return;

    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }

        const data = await signUp(
          email,
          password,
          firstName,
          lastName
        );

        const needsConfirmation =
          !data?.session ||
          data?.user?.identities?.length === 0 ||
          !data?.user?.email_confirmed_at;

        if (needsConfirmation) {
          setSuccessMessage(
            'Account created! Check your email for a confirmation link, then come back and sign in.'
          );

          setMode('signin');
        } else {
          navigate('/dashboard', { replace: true });
        }
      } else {
        await signIn(email, password);

        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      const msg = err?.message || 'Authentication failed';

      if (
        msg.toLowerCase().includes('email not confirmed') ||
        msg.toLowerCase().includes('email_not_confirmed')
      ) {
        setError(
          'Your email is not confirmed yet. Please check your inbox (and spam folder) for the confirmation link.'
        );
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setError('');
    setSuccessMessage('');
  };

  return (
    <div
  className="min-h-screen relative overflow-hidden bg-cover bg-center bg-no-repeat"
  style={{
    backgroundImage: "url('/bgg.png')",
  }}
>
  {/* Soft neutral overlay */}
  <div className="absolute inset-0 bg-[#F8F4EE]/35" />

  {/* Main auth content */}
  <div className="min-h-screen flex items-center justify-center p-6 relative z-10">

        <motion.div
          className="w-full max-w-md relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >

          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="font-display text-4xl font-bold text-neutral-900">
              Almari Adda
            </h1>

            <p className="text-neutral-700 text-sm font-medium mt-2">
              Sign in to access your digital closet
            </p>
          </div>

          {/* Card */}
          <div className="bg-[#FFFCF8]/95 backdrop-blur-sm rounded-2xl border border-[#D9CCBC] overflow-hidden shadow-2xl">

            {/* Tabs */}
            <div className="flex border-b border-neutral-200">

              <button
                type="button"
                className={`flex-1 py-4 text-sm font-medium transition-colors relative ${
                  mode === 'signin'
                    ? 'text-[#8B6B4A]'
                    : 'text-neutral-400 hover:text-neutral-600'
                }`}
                onClick={() => handleModeChange('signin')}
              >
                Sign in

                {mode === 'signin' && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8B6B4A]"
                    layoutId="tab-indicator"
                  />
                )}
              </button>

              <button
                type="button"
                className={`flex-1 py-4 text-sm font-medium transition-colors relative ${
                  mode === 'signup'
                    ? 'text-[#8B6B4A]'
                    : 'text-neutral-400 hover:text-neutral-600'
                }`}
                onClick={() => handleModeChange('signup')}
              >
                Sign up

                {mode === 'signup' && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8B6B4A]"
                    layoutId="tab-indicator"
                  />
                )}
              </button>

            </div>            {/* Form */}
            <div className="p-6 md:p-8">

              {/* Success message */}
              <AnimatePresence>
                {successMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="
                      mb-6
                      p-4
                      bg-[#F5F1EA]
                      border
                      border-[#D9CCBC]
                      text-[#6F5A44]
                      rounded-xl
                      text-sm
                      text-center
                      flex
                      flex-col
                      items-center
                      gap-2
                    "
                  >
                    <CheckCircle className="w-5 h-5 text-[#8B6B4A]" />

                    {successMessage}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="
                      mb-6
                      p-4
                      bg-red-50
                      border
                      border-red-200
                      text-red-700
                      rounded-xl
                      text-sm
                      text-center
                      flex
                      flex-col
                      items-center
                      gap-2
                    "
                  >
                    <Mail className="w-5 h-5 text-red-600" />

                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <form
                onSubmit={handleSubmit}
                className="space-y-4"
              >

                {/* First + Last name */}
                <AnimatePresence mode="popLayout">
                  {mode === 'signup' && (
                    <motion.div
                      initial={{
                        opacity: 0,
                        height: 0,
                      }}
                      animate={{
                        opacity: 1,
                        height: 'auto',
                      }}
                      exit={{
                        opacity: 0,
                        height: 0,
                      }}
                      transition={{
                        duration: 0.3,
                      }}
                      className="grid grid-cols-2 gap-3"
                    >

                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                          First name
                        </label>

                        <input
                          type="text"
                          placeholder="First name"
                          value={firstName}
                          onChange={(e) =>
                            setFirstName(e.target.value)
                          }
                          required
                          className="
                            w-full
                            border
                            border-neutral-300
                            rounded-lg
                            px-3.5
                            py-2.5
                            text-sm
                            focus:outline-none
                            focus:ring-2
                            focus:ring-[#A67C52]
                            focus:border-[#8B6B4A]
                          "
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
                          onChange={(e) =>
                            setLastName(e.target.value)
                          }
                          required
                          className="
                            w-full
                            border
                            border-neutral-300
                            rounded-lg
                            px-3.5
                            py-2.5
                            text-sm
                            focus:outline-none
                            focus:ring-2
                            focus:ring-[#A67C52]
                            focus:border-[#8B6B4A]
                          "
                        />
                      </div>

                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Email
                  </label>

                  <input
                    type="email"
                    placeholder="name@email.com"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    required
                    className="
                      w-full
                      border
                      border-neutral-300
                      rounded-lg
                      px-3.5
                      py-2.5
                      text-sm
                      focus:outline-none
                      focus:ring-2
                      focus:ring-[#A67C52]
                      focus:border-[#8B6B4A]
                    "
                  />
                </div>                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Password
                  </label>

                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    required
                    className="
                      w-full
                      border
                      border-neutral-300
                      rounded-lg
                      px-3.5
                      py-2.5
                      text-sm
                      focus:outline-none
                      focus:ring-2
                      focus:ring-[#A67C52]
                      focus:border-[#8B6B4A]
                    "
                  />
                </div>

                {/* Confirm password */}
                <AnimatePresence mode="popLayout">
                  {mode === 'signup' && (
                    <motion.div
                      initial={{
                        opacity: 0,
                        height: 0,
                      }}
                      animate={{
                        opacity: 1,
                        height: 'auto',
                      }}
                      exit={{
                        opacity: 0,
                        height: 0,
                      }}
                      transition={{
                        duration: 0.3,
                      }}
                    >
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                        Confirm password
                      </label>

                      <input
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) =>
                          setConfirmPassword(e.target.value)
                        }
                        required
                        className="
                          w-full
                          border
                          border-neutral-300
                          rounded-lg
                          px-3.5
                          py-2.5
                          text-sm
                          focus:outline-none
                          focus:ring-2
                          focus:ring-[#A67C52]
                          focus:border-[#8B6B4A]
                        "
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="
                    w-full
                    bg-[#8B6B4A]
                    text-white
                    font-medium
                    text-sm
                    py-3
                    rounded-lg
                    hover:bg-[#70553A]
                    transition
                    disabled:opacity-60
                    disabled:cursor-not-allowed
                  "
                >
                  {isLoading
                    ? 'Loading...'
                    : mode === 'signin'
                      ? 'Sign in'
                      : 'Sign up'}
                </button>

              </form>

              {/* Switch mode */}
              <div className="mt-6 text-center text-sm text-neutral-500">

                {mode === 'signin' ? (
                  <p>
                    Don't have an account?{' '}

                    <button
                      type="button"
                      onClick={() =>
                        handleModeChange('signup')
                      }
                      className="
                        text-[#8B6B4A]
                        font-medium
                        hover:underline
                      "
                    >
                      Sign up
                    </button>
                  </p>
                ) : (
                  <p>
                    Already have an account?{' '}

                    <button
                      type="button"
                      onClick={() =>
                        handleModeChange('signin')
                      }
                      className="
                        text-[#8B6B4A]
                        font-medium
                        hover:underline
                      "
                    >
                      Sign in
                    </button>
                  </p>
                )}

              </div>

            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}