'use client';

import { useState } from 'react';
import { Video, User, LogOut, Menu, X, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { signOut } from '@/lib/auth';
import AuthModal from './AuthModal';

interface NavigationProps {
  onNavigate: (view: 'home' | 'gallery' | 'influencers') => void;
  currentView: 'home' | 'gallery' | 'influencers';
}

export default function Navigation({ onNavigate, currentView }: NavigationProps) {
  const { user, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      onNavigate('home');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  return (
    <>
      <nav className="navigation">
        <div className="nav-container">
          <div className="nav-brand">
            <Video size={28} />
            <span>AI Video Studio</span>
          </div>

          <button
            className="mobile-menu-button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <div className={`nav-links ${mobileMenuOpen ? 'nav-links-mobile-open' : ''}`}>
            <button
              className={`nav-link ${currentView === 'home' ? 'nav-link-active' : ''}`}
              onClick={() => {
                onNavigate('home');
                setMobileMenuOpen(false);
              }}
            >
              Create
            </button>

            {user && (
              <>
                <button
                  className={`nav-link ${currentView === 'gallery' ? 'nav-link-active' : ''}`}
                  onClick={() => {
                    onNavigate('gallery');
                    setMobileMenuOpen(false);
                  }}
                >
                  My Videos
                </button>
                <button
                  className={`nav-link ${currentView === 'influencers' ? 'nav-link-active' : ''}`}
                  onClick={() => {
                    onNavigate('influencers');
                    setMobileMenuOpen(false);
                  }}
                >
                  <Sparkles size={16} style={{ display: 'inline', marginRight: '4px' }} />
                  AI Influencers
                </button>
              </>
            )}
          </div>

          <div className={`nav-auth ${mobileMenuOpen ? 'nav-auth-mobile-open' : ''}`}>
            {loading ? (
              <div className="nav-loading">Loading...</div>
            ) : user ? (
              <div className="nav-user">
                <div className="user-info">
                  <User size={20} />
                  <span>{user.email}</span>
                </div>
                <button onClick={handleSignOut} className="nav-button">
                  <LogOut size={20} />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <button onClick={() => setShowAuthModal(true)} className="nav-button-primary">
                <User size={20} />
                Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
        }}
      />
    </>
  );
}
