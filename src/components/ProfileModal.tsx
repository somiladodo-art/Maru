import React, { useEffect, useState } from 'react';

interface ProfileModalProps {
  user: { id: number; email: string };
  onClose: () => void;
  onLogout: () => void;
}

interface Result {
  id: number;
  min_earn: number;
  max_earn: number;
  surveys: number;
  tier: string;
  created_at: string;
}

export default function ProfileModal({ user, onClose, onLogout }: ProfileModalProps) {
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/results/${user.id}`)
      .then(res => res.json())
      .then(data => {
        setResults(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [user.id]);

  return (
    <div className="fixed inset-0 bg-black/50 z-[999] flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xl p-8 w-full max-w-2xl max-h-[80vh] flex flex-col relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-2xl font-bold text-gray-400 hover:text-red-500 transition-colors"
        >
          &times;
        </button>
        
        <div className="flex items-center justify-between mb-6 pr-8">
          <h2 className="font-heading text-2xl font-bold text-gray-800">Your Profile</h2>
          <button 
            onClick={onLogout}
            className="text-sm font-semibold text-red-600 hover:text-red-800 transition-colors"
          >
            Log Out
          </button>
        </div>
        
        <div className="mb-6">
          <p className="text-sm text-gray-500 font-medium">Logged in as</p>
          <p className="font-semibold text-lg text-gray-800">{user.email}</p>
        </div>
        
        <h3 className="font-heading text-xl font-semibold mb-4 text-gray-800">Past Quiz Results</h3>
        
        <div className="overflow-y-auto flex-1 pr-2">
          {loading ? (
            <div className="text-center py-8 font-medium text-gray-500">Loading results...</div>
          ) : results.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-500">
              You haven't completed any quizzes yet.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {results.map(res => (
                <div key={res.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div className="font-heading font-semibold text-sm text-[#B92B27] bg-red-50 px-3 py-1 rounded-full inline-block">
                      {res.tier}
                    </div>
                    <div className="text-xs font-medium text-gray-400">
                      {new Date(res.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex gap-8 mt-4">
                    <div>
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Est. Earnings</div>
                      <div className="font-heading font-bold text-2xl text-gray-800">${res.min_earn} - ${res.max_earn}</div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Surveys</div>
                      <div className="font-heading font-bold text-2xl text-gray-800">{res.surveys}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
