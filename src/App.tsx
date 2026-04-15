import React, { useState, useEffect } from 'react';
import { 
  Check, MapPin, Trophy, Zap, BarChart2, CreditCard, ChevronRight, ArrowLeft, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AuthModal from './components/AuthModal';
import ProfileModal from './components/ProfileModal';
import { db, auth } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo?: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default function App() {
  const [user, setUser] = useState<{ id: number; email: string } | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [claimEmail, setClaimEmail] = useState('');
  const [quizStep, setQuizStep] = useState(0); // 0: Landing, 1-4: Questions, 5: Email, 6: Redirecting
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isQualified, setIsQualified] = useState(true);

  const questions = [
    {
      id: 1,
      question: "Are you a current resident of Canada?",
      options: ["Yes, I live in Canada", "No, I live elsewhere"],
      qualifier: (ans: string) => ans === "Yes, I live in Canada"
    },
    {
      id: 2,
      question: "How often do you share your opinion on products or services?",
      options: ["Daily", "Weekly", "Monthly", "Rarely"]
    },
    {
      id: 3,
      question: "What is your primary motivation for joining our community?",
      options: ["Earning Rewards", "Influencing Top Brands", "Helping Researchers", "Just for Fun"]
    },
    {
      id: 4,
      question: "Which reward would you prefer to receive first?",
      options: ["PayPal Cash", "Amazon Gift Card", "Starbucks Rewards", "Visa Prepaid Card"]
    }
  ];

  useEffect(() => {
    // Check local storage for user session
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (userData: { id: number; email: string }) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    setShowAuth(false);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    setShowProfile(false);
  };

  const handleClaim = async () => {
    const emailToStore = user?.email || claimEmail;
    const redirectUrl = "https://afflat3d2.com/trk/lnk/0C3A139E-9517-46F7-825B-A826E3E5BA17/?o=24889&c=918277&a=762196&k=96EC8F19A4F6412CD019C3B24D02F17B&l=26271&s1=QUiz";

    if (emailToStore) {
      setIsSubmitting(true);
      localStorage.setItem('claimedEmail', emailToStore);
      
      try {
        await addDoc(collection(db, 'leads'), {
          email: emailToStore,
          quizAnswers,
          createdAt: serverTimestamp()
        });
        setQuizStep(6);
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 1500);
      } catch (error) {
        setQuizStep(6);
        setTimeout(() => { window.location.href = redirectUrl; }, 1000);
        handleFirestoreError(error, OperationType.CREATE, 'leads');
      }
    } else {
      window.location.href = redirectUrl;
    }
  };

  const startQuiz = () => {
    setQuizStep(1);
    setIsQualified(true);
    setQuizAnswers({});
  };
  const nextStep = (answer: string) => {
    setQuizAnswers(prev => ({ ...prev, [quizStep]: answer }));
    
    // Check qualification on first question
    if (quizStep === 1 && !questions[0].qualifier?.(answer)) {
      setIsQualified(false);
    }
    
    setQuizStep(prev => prev + 1);
  };
  const prevStep = () => {
    if (quizStep === 2) {
      setIsQualified(true);
    }
    setQuizStep(prev => prev - 1);
  };

  return (
    <>
      {showAuth && (
        <AuthModal 
          onClose={() => setShowAuth(false)} 
          onLogin={handleLogin} 
        />
      )}
      
      {showProfile && user && (
        <ProfileModal 
          user={user} 
          onClose={() => setShowProfile(false)} 
          onLogout={handleLogout} 
        />
      )}

      {/* TOPBAR */}
      <div className="topbar">
        <div className="logo-wrap">
          <div className="logo-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.5l1.5 4h-3l1.5-4zm4.5 5.5l2.5-1.5-1 4.5 3.5 1.5-4.5 2.5 1.5 5-4-3-1.5 4h-2l-1.5-4-4 3 1.5-5-4.5-2.5 3.5-1.5-1-4.5 2.5 1.5 2.5-3.5 1.5 3.5 2.5-3.5z" />
            </svg>
          </div>
          <div className="logo-text">
            MARU VOICE
            <span>CANADA</span>
          </div>
        </div>
        <div className="topbar-badges">
          {user ? (
            <button 
              onClick={() => setShowProfile(true)}
              className="btn-secondary"
            >
              Profile
            </button>
          ) : (
            <>
              <button 
                onClick={() => setShowAuth(true)}
                className="btn-secondary hidden sm:inline-flex"
              >
                Log In
              </button>
              <button 
                onClick={() => setShowAuth(true)}
                className="btn-primary"
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {quizStep === 0 ? (
          <motion.div 
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* SQUEEZE SECTION */}
            <div className="squeeze-container">
              <div className="squeeze-card">
                
                {/* LEFT SIDE - BENEFITS & INFO */}
                <div className="squeeze-left">
                  <h1 className="squeeze-title">
                    Get Paid For Your <span>Opinion</span>
                  </h1>
                  <p className="squeeze-sub">
                    Join Maru Voice Canada's premier community of survey panelists today. Share your thoughts on products and services, and earn real rewards.
                  </p>
                  
                  <div className="benefit-list">
                    <div className="benefit-item">
                      <div className="benefit-icon"><Zap size={18} strokeWidth={2.5} /></div>
                      <div className="benefit-text">
                        <h3>500 Welcome Points</h3>
                        <p>Instantly credited to your account the moment you verify your email.</p>
                      </div>
                    </div>
                    <div className="benefit-item">
                      <div className="benefit-icon"><CreditCard size={18} strokeWidth={2.5} /></div>
                      <div className="benefit-text">
                        <h3>Flexible Payouts</h3>
                        <p>Redeem your points for PayPal cash, Amazon gift cards, or Starbucks rewards.</p>
                      </div>
                    </div>
                    <div className="benefit-item">
                      <div className="benefit-icon"><Trophy size={18} strokeWidth={2.5} /></div>
                      <div className="benefit-text">
                        <h3>Influence Tomorrow</h3>
                        <p>Your insights directly shape the products and services of top brands.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT SIDE - CTA */}
                <div className="squeeze-right">
                  <div className="form-header">
                    <h2>Check Your Eligibility</h2>
                    <p>Take our 30-second quiz to see if you qualify for the 500 bonus points.</p>
                  </div>
                  
                  <div className="flex flex-col gap-4 mt-8">
                    <button 
                      className="btn-submit" 
                      onClick={startQuiz}
                    >
                      Start Qualification Quiz <ChevronRight size={20} strokeWidth={2.5} />
                    </button>
                    
                    <div className="trust-badges">
                      <Check size={16} strokeWidth={3} /> No credit card required
                      <span className="mx-2">•</span>
                      <Check size={16} strokeWidth={3} /> 100% Free
                    </div>
                  </div>
                  
                  <p className="fine-print mt-8">
                    Canadian residents 18+ · Double opt-in protected<br/>
                    No spam, ever · Unsubscribe anytime · Maru Group Company
                  </p>
                </div>

              </div>
            </div>

            {/* WHY JOIN US */}
            <div className="trust-section">
              <h2 className="trust-title">Why join us?</h2>
              <p className="trust-sub">Learn how you can earn rewards while shaping the future.</p>
              
              <div className="trust-grid">
                <div className="trust-card">
                  <div className="trust-icon-wrap">
                    <Trophy />
                  </div>
                  <h3 className="trust-card-title">Rewards and Incentives</h3>
                  <p className="trust-card-desc">Earn gift cards from retailers like Amazon and Starbucks, and PayPal cash for sharing your opinions.</p>
                </div>
                <div className="trust-card">
                  <div className="trust-icon-wrap">
                    <Zap />
                  </div>
                  <h3 className="trust-card-title">Influence Tomorrow</h3>
                  <p className="trust-card-desc">Brands, organizations, media outlets, researchers and pollsters want to hear what you have to say. Your insights drive change.</p>
                </div>
                <div className="trust-card">
                  <div className="trust-icon-wrap">
                    <BarChart2 />
                  </div>
                  <h3 className="trust-card-title">Diverse Surveys</h3>
                  <p className="trust-card-desc">From product feedback to social issues, our surveys cover a wide range of topics. Complete the ones that interest you most.</p>
                </div>
              </div>
            </div>

            {/* TESTIMONIALS */}
            <div className="testi-section">
              <h2 className="trust-title">What our members are saying...</h2>
              <div className="testi-grid">
                <div className="testi-card">
                  <p className="testi-quote">"Maru Voice Canada Survey as a great and relatively easy way to earn some quick cash and/or prizes. By completing some relatively easy but thought provoking surveys you can earn yourself some great gifts for your own personal opinions . give it a try"</p>
                  <div className="testi-author">
                    <span className="testi-name">E.B.</span>
                    <span className="testi-loc"><MapPin /> Canada</span>
                  </div>
                </div>
                <div className="testi-card">
                  <p className="testi-quote">"I would like to recommend the Maru Voice Canada Survey as a great and relatively easy way to earn some quick cash and/or prizes. By completing some relatively easy but thought provoking surveys you can earn yourself some great gifts for your own personal opinions ... give it a try, you will not regret it !!!!!!!"</p>
                  <div className="testi-author">
                    <span className="testi-name">G.H.</span>
                    <span className="testi-loc"><MapPin /> Canada</span>
                  </div>
                </div>
                <div className="testi-card">
                  <p className="testi-quote">"Interesting surveys regularly sent out. Ease of getting rewards earned."</p>
                  <div className="testi-author">
                    <span className="testi-name">D.G.</span>
                    <span className="testi-loc"><MapPin /> Canada</span>
                  </div>
                </div>
              </div>
            </div>

            {/* FOOTER BANNER */}
            <div className="footer-banner">
              <h2 className="footer-banner-title">Total value awarded to Maru Voice Canada panelists in January</h2>
              <div className="footer-banner-amount">$88,949.70</div>
            </div>
          </motion.div>
        ) : quizStep <= questions.length ? (
          <motion.div 
            key={`step-${quizStep}`}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            className="quiz-container"
          >
            <div className="quiz-card">
              <div className="quiz-progress">
                <div 
                  className="quiz-progress-bar" 
                  style={{ width: `${(quizStep / (questions.length + 1)) * 100}%` }}
                />
              </div>
              
              <button onClick={prevStep} className="quiz-back">
                <ArrowLeft size={18} /> Back
              </button>

              <h2 className="quiz-question">{questions[quizStep - 1].question}</h2>
              
              <div className="quiz-options">
                {questions[quizStep - 1].options.map((option, idx) => (
                  <button 
                    key={idx}
                    onClick={() => nextStep(option)}
                    className="quiz-option"
                  >
                    {option}
                    <ChevronRight size={18} className="quiz-option-icon" />
                  </button>
                ))}
              </div>

              <div className="quiz-footer">
                Question {quizStep} of {questions.length + 1}
              </div>
            </div>
          </motion.div>
        ) : quizStep === 5 && isQualified ? (
          <motion.div 
            key="email-step"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            className="quiz-container"
          >
            <div className="quiz-card">
              <div className="quiz-progress">
                <div className="quiz-progress-bar" style={{ width: '90%' }} />
              </div>

              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-full mb-4">
                  <Check size={32} strokeWidth={3} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Great News! You Qualify.</h2>
                <p className="text-gray-600">Enter your email below to claim your 500 bonus points and finish your registration.</p>
              </div>

              {user ? (
                <div className="text-center mb-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">Claiming rewards for:</p>
                  <p className="font-semibold text-lg text-gray-900">{user.email}</p>
                </div>
              ) : (
                <div className="input-group mb-6">
                  <label className="input-label">Email Address</label>
                  <input 
                    type="email" 
                    value={claimEmail}
                    onChange={(e) => setClaimEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="email-input"
                    autoFocus
                  />
                </div>
              )}

              <button 
                className="btn-submit w-full" 
                onClick={handleClaim}
                disabled={isSubmitting || (!user && (!claimEmail || !claimEmail.includes('@')))}
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin mx-auto" />
                ) : (
                  <>Claim My 500 Points & Continue <ChevronRight size={20} strokeWidth={2.5} /></>
                )}
              </button>

              <p className="text-xs text-center text-gray-400 mt-6">
                By clicking above, you agree to our terms and to receive survey invitations.
              </p>
            </div>
          </motion.div>
        ) : quizStep === 5 && !isQualified ? (
          <motion.div 
            key="disqualified"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="quiz-container"
          >
            <div className="quiz-card text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 text-red-600 rounded-full mb-6">
                <Zap size={32} strokeWidth={3} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">We're Sorry...</h2>
              <p className="text-gray-600 mb-8">
                Currently, Maru Voice Canada is only open to residents of Canada. 
                We are unable to process your registration at this time.
              </p>
              <button 
                onClick={() => setQuizStep(0)}
                className="btn-secondary"
              >
                Return to Home
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="redirecting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="quiz-container"
          >
            <div className="quiz-card text-center py-12">
              <Loader2 size={48} className="animate-spin text-blue-600 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Redirecting to Final Step...</h2>
              <p className="text-gray-600">Please wait while we prepare your account.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
