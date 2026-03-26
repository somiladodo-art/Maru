import React, { useState } from 'react';

interface AuthModalProps {
  onClose: () => void;
  onLogin: (user: { id: number; email: string }) => void;
}

export default function AuthModal({ onClose, onLogin }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
    
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }
      
      onLogin(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[999] flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xl p-8 w-full max-w-md relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-2xl font-bold text-gray-400 hover:text-red-500 transition-colors"
        >
          &times;
        </button>
        
        <h2 className="font-heading text-2xl font-bold mb-6 text-center text-gray-800">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-4 text-sm font-medium">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
              placeholder="you@example.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
              placeholder="••••••••"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full mt-4 bg-[#B92B27] text-white rounded-full p-3 font-heading font-semibold text-lg hover:bg-[#9A2320] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Please wait...' : (isLogin ? 'Log In' : 'Sign Up')}
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm font-medium text-gray-600">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-[#B92B27] hover:underline font-semibold"
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </div>
      </div>
    </div>
  );
}
