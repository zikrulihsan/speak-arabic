import React, { useState } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import type { ChatMessage, SavedKeyword } from './types';
import Sidebar from './components/Sidebar';
import ChatPage from './pages/ChatPage';
import KeywordsPage from './pages/KeywordsPage';
import { MenuIcon } from './components/icons';

type View = 'chat' | 'keywords';

function App() {
  const [messages, setMessages] = useLocalStorage<ChatMessage[]>('chatHistory_single_v1', []);
  const [savedKeywords, setSavedKeywords] = useLocalStorage<SavedKeyword[]>('savedKeywords_v3', []);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState<View>('chat');

  const handleNavigate = (view: View) => {
    setCurrentView(view);
    setIsSidebarOpen(false); // Close sidebar on navigation
  };

  return (
    <div className="flex h-screen w-screen bg-slate-900 text-white font-sans">
      {/* Sidebar for Desktop */}
      <div className="hidden lg:block lg:w-72 flex-shrink-0 border-r border-slate-700/50">
        <Sidebar 
          currentView={currentView}
          onNavigate={handleNavigate}
          onClose={() => {}} // Not used on desktop
        />
      </div>
      
      {/* Sidebar for Mobile (Overlay) */}
      <div 
        className={`fixed inset-0 z-30 transition-transform transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:hidden`}
      >
        <div className="absolute inset-0 bg-black/60" onClick={() => setIsSidebarOpen(false)}></div>
        <div className="relative w-[90%] max-w-xs h-full">
            <Sidebar 
              currentView={currentView}
              onNavigate={handleNavigate}
              onClose={() => setIsSidebarOpen(false)}
            />
        </div>
      </div>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="flex items-center justify-between p-4 border-b border-slate-700/50 flex-shrink-0">
          <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-slate-300">
              <MenuIcon className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold truncate">
            {currentView === 'chat' ? 'Percakapan' : 'Daftar Kata Kunci'}
          </h1>
          <div className="w-6 lg:hidden"></div> {/* Spacer for mobile to balance the menu icon */}
        </header>

        <div className="flex-1 overflow-y-auto">
          {currentView === 'chat' && (
            <ChatPage
              messages={messages}
              setMessages={setMessages}
              setSavedKeywords={setSavedKeywords}
            />
          )}
          {currentView === 'keywords' && (
            <KeywordsPage
              keywords={savedKeywords}
              onClear={() => setSavedKeywords([])}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;