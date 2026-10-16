import React from 'react';
import { Plus, Sun, Moon, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface TopBarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenCreate: () => void;
  onOpenAuth: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  activeFormTitle?: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentView,
  onNavigate,
  onOpenCreate,
  onOpenAuth,
  isDarkMode,
  onToggleTheme,
  activeFormTitle,
}) => {
  const { user, profile, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FFFFFF]/90 dark:bg-[#191D1A]/90 backdrop-blur-md border-b border-[#E2E4DF] dark:border-[#272C28] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark (Single text element wordmark, no decorative pill) */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2.5 text-left focus:outline-none group"
            title="Formora Home"
          >
            <div className="w-8 h-8 rounded-lg bg-[#176B52] flex items-center justify-center text-white font-bold text-base shadow-sm group-hover:bg-[#125541] transition-colors">
              F
            </div>
            <span className="text-xl font-bold tracking-tight text-[#171918] dark:text-[#F0F2EE] whitespace-nowrap">
              Formora
            </span>
          </button>

          {activeFormTitle && (
            <div className="hidden lg:flex items-center gap-2 text-xs text-[#737873] dark:text-[#9BA19B] border-l border-[#E2E4DF] dark:border-[#272C28] pl-3 ml-2">
              <span className="truncate max-w-[200px] font-medium text-[#171918] dark:text-[#F0F2EE]">
                {activeFormTitle}
              </span>
            </div>
          )}
        </div>

        {/* Zone 2: 4-5 Concise single-line navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#737873] dark:text-[#9BA19B]">
          <button
            onClick={() => onNavigate('dashboard')}
            className={`whitespace-nowrap transition-colors hover:text-[#171918] dark:hover:text-[#F0F2EE] ${
              currentView === 'dashboard' ? 'text-[#176B52] dark:text-[#228B6B] font-semibold' : ''
            }`}
          >
            Forms
          </button>
          <button
            onClick={() => onNavigate('templates')}
            className={`whitespace-nowrap transition-colors hover:text-[#171918] dark:hover:text-[#F0F2EE] ${
              currentView === 'templates' ? 'text-[#176B52] dark:text-[#228B6B] font-semibold' : ''
            }`}
          >
            Templates
          </button>
          <button
            onClick={() => onNavigate('analytics-hub')}
            className={`whitespace-nowrap transition-colors hover:text-[#171918] dark:hover:text-[#F0F2EE] ${
              currentView === 'analytics-hub' ? 'text-[#176B52] dark:text-[#228B6B] font-semibold' : ''
            }`}
          >
            Analytics & Reports
          </button>
          <button
            onClick={() => onNavigate('statistics')}
            className={`whitespace-nowrap transition-colors hover:text-[#171918] dark:hover:text-[#F0F2EE] ${
              currentView === 'statistics' ? 'text-[#176B52] dark:text-[#228B6B] font-semibold' : ''
            }`}
          >
            Advanced Statistics
          </button>
          <button
            onClick={() => onNavigate('landing')}
            className={`whitespace-nowrap transition-colors hover:text-[#171918] dark:hover:text-[#F0F2EE] ${
              currentView === 'landing' ? 'text-[#176B52] dark:text-[#228B6B] font-semibold' : ''
            }`}
          >
            Overview
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action + Theme Toggle + User Profile */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onToggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-lg text-[#737873] hover:text-[#171918] dark:text-[#9BA19B] dark:hover:text-[#F0F2EE] hover:bg-[#F0F2ED] dark:hover:bg-[#222723] transition-colors"
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={onOpenCreate}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-[#176B52] hover:bg-[#125541] rounded-lg shadow-sm transition-all whitespace-nowrap shrink-0 active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Form</span>
          </button>

          {/* User Profile or Sign In */}
          {user ? (
            <div className="relative group">
              <button
                className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-[#176B52]/30 transition-all focus:outline-none"
                title={`${profile?.name || user.displayName || 'User'} (${user.email})`}
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full object-cover border border-[#E2E4DF] dark:border-[#272C28]"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#176B52]/10 dark:bg-[#176B52]/20 text-[#176B52] dark:text-[#228B6B] border border-[#176B52]/20 flex items-center justify-center font-bold text-xs">
                    {(profile?.name || user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
              </button>

              {/* Account Dropdown */}
              <div className="absolute right-0 mt-2 w-56 p-2 bg-white dark:bg-[#191D1A] rounded-xl border border-[#E2E4DF] dark:border-[#272C28] shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
                <div className="px-3 py-2 border-b border-[#E2E4DF] dark:border-[#272C28] mb-1">
                  <p className="text-xs font-semibold text-[#171918] dark:text-[#F0F2EE] truncate">
                    {profile?.name || user.displayName || 'Account'}
                  </p>
                  <p className="text-[11px] text-[#737873] dark:text-[#9BA19B] truncate">
                    {user.email}
                  </p>
                  <span className="inline-block mt-1.5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[#176B52] dark:text-[#228B6B] bg-[#E8F3EE] dark:bg-[#172D24] rounded">
                    {profile?.tier || 'Free'} Plan
                  </span>
                </div>

                <button
                  onClick={() => logout()}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#171918] dark:text-[#F0F2EE] border border-[#E2E4DF] dark:border-[#272C28] hover:bg-[#F0F2ED] dark:hover:bg-[#222723] rounded-lg transition-colors shadow-xs"
            >
              <LogIn className="w-3.5 h-3.5 text-[#176B52] dark:text-[#228B6B]" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
