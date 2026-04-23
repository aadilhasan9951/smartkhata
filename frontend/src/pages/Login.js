import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Phone, User, Lock, ArrowRight, Sparkles } from 'lucide-react';

const Login = () => {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [isValidPhone, setIsValidPhone] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Create floating particles
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const newParticles = [];
    for (let i = 0; i < 50; i++) {
      newParticles.push({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: Math.random() * 6 + 2,
        delay: Math.random() * 5,
        duration: Math.random() * 10 + 10
      });
    }
    setParticles(newParticles);
  }, []);

  const handlePhoneSubmit = (e) => {
    e.preventDefault();
    setError('');

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phone) {
      setError('Please enter your phone number');
      return;
    }
    if (phone.length !== 10) {
      setError('Phone number must be exactly 10 digits');
      return;
    }
    if (!phoneRegex.test(phone)) {
      setError('Invalid Indian phone number. Must start with 6, 7, 8, or 9');
      return;
    }

    checkUserExists();
  };

  const checkUserExists = async () => {
    setLoading(true);
    try {
      await login(phone, undefined);
      navigate('/');
    } catch (err) {
      if (err.response?.data?.error?.includes('Name')) {
        setIsNewUser(true);
        setError('');
      } else {
        setError(err.response?.data?.error || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || name.trim().length < 2) {
      setError('Please enter a valid name');
      return;
    }

    setLoading(true);
    try {
      await login(phone, name.trim());
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 0 && !['6', '7', '8', '9'].includes(value[0])) {
      value = '';
    }
    if (value.length > 10) {
      value = value.slice(0, 10);
    }
    setPhone(value);
    const phoneRegex = /^[6-9]\d{9}$/;
    setIsValidPhone(value.length === 10 && phoneRegex.test(value));
  };

  const handlePhonePaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const digitsOnly = pastedText.replace(/\D/g, '');
    const phoneRegex = /^[6-9]\d{9}$/;
    if (phoneRegex.test(digitsOnly)) {
      setPhone(digitsOnly);
      setIsValidPhone(true);
    } else if (digitsOnly.length > 0 && ['6', '7', '8', '9'].includes(digitsOnly[0])) {
      setPhone(digitsOnly.slice(0, 10));
      setIsValidPhone(digitsOnly.length >= 10 && phoneRegex.test(digitsOnly.slice(0, 10)));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-purple-50 to-blue-100 animate-gradient"></div>
      
      {/* Floating Particles */}
      <div className="particles">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="particle"
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`
            }}
          />
        ))}
      </div>

      {/* Main Card */}
      <div className="premium-card p-6 sm:p-8 md:p-10 w-full max-w-md relative z-10 animate-scale-in">
        {/* 3D Logo */}
        <div className="logo-3d flex justify-center mb-6 sm:mb-8">
          <div className="logo-3d-inner">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 rounded-3xl flex items-center justify-center shadow-lg animate-glow">
              <Lock className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-6 sm:mb-8 animate-fade-in-up">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2 sm:mb-3">SmartKhata</h1>
          <p className="text-sm sm:text-base text-gray-600 flex items-center justify-center gap-2">
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500" />
            Digital Ledger for Your Business
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500" />
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 animate-fade-in">
            {error}
          </div>
        )}

        {!isNewUser ? (
          <form onSubmit={handlePhoneSubmit} className="space-y-4 sm:space-y-6 animate-slide-in">
            <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                Phone Number
              </label>
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-gray-50 border border-gray-300 rounded-l-xl px-3 py-2 sm:py-3">
                  <span className="text-gray-500 font-medium text-sm sm:text-base">+91</span>
                </div>
                <div className="flex-1 relative">
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={phone}
                    onChange={handlePhoneChange}
                    onPaste={handlePhonePaste}
                    placeholder="Enter 10-digit number"
                    maxLength={10}
                    className={`premium-input w-full rounded-l-none text-sm sm:text-base transition-all duration-300 ${
                      phone.length === 10 && !isValidPhone ? 'border-red-400' : ''
                    } ${isValidPhone ? 'border-green-400 ring-4 ring-green-100' : ''}`}
                    required
                  />
                  {phone.length > 0 && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {isValidPhone ? (
                        <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      ) : phone.length === 10 ? (
                        <div className="w-5 h-5 sm:w-6 sm:h-6 bg-red-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                      ) : (
                        <div className="text-[10px] sm:text-xs text-gray-400">
                          {phone.length}/10
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <Phone className="w-3 h-3" />
                Enter valid Indian mobile number (e.g., 9876543210)
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || phone.length !== 10 || !isValidPhone}
              className={`premium-button w-full flex items-center justify-center gap-2 sm:gap-3 animate-fade-in-up transition-all duration-300 text-sm sm:text-base py-2.5 sm:py-3 ${
                phone.length === 10 && isValidPhone ? 'scale-105' : 'opacity-80'
              }`}
              style={{ animationDelay: '0.2s' }}
            >
              {loading ? (
                <>
                  <div className="loading-spinner w-4 h-4 sm:w-5 sm:h-5"></div>
                  Processing...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="space-y-4 sm:space-y-6 animate-slide-in">
            <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                Your Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="premium-input w-full pl-10 sm:pl-12 text-sm sm:text-base"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                This will be used to identify your account
              </p>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 sm:p-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <p className="text-xs sm:text-sm text-purple-700">
                <strong>Phone:</strong> {phone}
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="premium-button w-full flex items-center justify-center gap-2 sm:gap-3 animate-fade-in-up text-sm sm:text-base py-2.5 sm:py-3"
              style={{ animationDelay: '0.3s' }}
            >
              {loading ? (
                <>
                  <div className="loading-spinner w-4 h-4 sm:w-5 sm:h-5"></div>
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsNewUser(false);
                setError('');
              }}
              className="w-full text-gray-600 py-2 text-xs sm:text-sm hover:text-gray-800 transition-colors animate-fade-in-up"
              style={{ animationDelay: '0.4s' }}
            >
              ← Back to phone number
            </button>
          </form>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 animate-fade-in">
          <p className="text-center text-xs text-gray-500">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
