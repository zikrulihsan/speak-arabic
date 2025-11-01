
import React, { useState, useEffect } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import type { ChatMessage, ChatSession, SavedKeyword } from './types';
import Sidebar from './components/Sidebar';
import ChatPage from './pages/ChatPage';
import KeywordsPage from './pages/KeywordsPage';
// Fix: Import the missing ChatBubbleLeftRightIcon component.
import { MenuIcon, PlusIcon, ChatBubbleLeftRightIcon } from './components/icons';

type View = 'chat' | 'keywords';

function App() {
  const [chatHistory, setChatHistory] = useLocalStorage<ChatSession[]>('chatHistory_multi_v3', []);
  const [activeChatId, setActiveChatId] = useLocalStorage<string | null>('activeChatId_v3', null);
  const [savedKeywords, setSavedKeywords] = useLocalStorage<SavedKeyword[]>('savedKeywords_v3', []);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState<View>('chat');

  useEffect(() => {
    if (activeChatId && !chatHistory.find(c => c.id === activeChatId)) {
      setActiveChatId(null);
    }
  }, [activeChatId, chatHistory, setActiveChatId]);


  const handleNewChat = () => {
    const newChat: ChatSession = {
        id: Date.now().toString(),
        title: 'Percakapan Baru',
        messages: [],
    };
    setChatHistory(prev => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    setCurrentView('chat');
    setIsSidebarOpen(false);
  }

  const handleSelectChat = (id: string) => {
    setActiveChatId(id);
    setCurrentView('chat');
    setIsSidebarOpen(false);
  }

  const handleUpdateMessages = (updater: (prevMessages: ChatMessage[]) => ChatMessage[]) => {
      if(!activeChatId) return;

      setChatHistory(prevHistory => {
          return prevHistory.map(session => {
              if (session.id === activeChatId) {
                  const oldMessages = session.messages;
                  const newMessages = updater(oldMessages);

                  const firstUserMessage = newMessages.find(m => m.author === 'user');
                  const newTitle = oldMessages.length === 0 && newMessages.length > 0 && firstUserMessage
                      ? (firstUserMessage.content as string).substring(0, 40) + ((firstUserMessage.content as string).length > 40 ? '...' : '')
                      : session.title;
                  
                  return { ...session, messages: newMessages, title: newTitle };
              }
              return session;
          });
      });
  };

  const handleNewKeywords = (newKeywords: SavedKeyword[]) => {
    setSavedKeywords(prevKeywords => {
      const existingKeywords = new Set(prevKeywords.map(k => k.indonesian.toLowerCase()));
      const uniqueNewKeywords = newKeywords.filter(
        k => !existingKeywords.has(k.indonesian.toLowerCase())
      );
      return [...prevKeywords, ...uniqueNewKeywords];
    });
  };

  const handleClearKeywords = () => {
    setSavedKeywords([]);
  };
  
  const handleNavigate = (view: View) => {
    setCurrentView(view);
    setIsSidebarOpen(false);
  }

  const activeChat = chatHistory.find(chat => chat.id === activeChatId);
  const getPageTitle = () => {
    if (currentView === 'keywords') return 'Daftar Kata Kunci';
    return activeChat?.title || 'Percakapan';
  }

  return (
    <div className="flex h-screen w-screen bg-slate-900 text-white font-sans">
      <div className="hidden lg:block lg:w-72 flex-shrink-0 border-r border-slate-700/50">
        <Sidebar 
          onClose={() => {}} 
          currentView={currentView}
          onNavigate={handleNavigate}
          chatHistory={chatHistory}
          activeChatId={activeChatId}
          onNewChat={handleNewChat}
          onSelectChat={handleSelectChat}
        />
      </div>
      
      <div 
        className={`fixed inset-0 z-30 transition-transform transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:hidden`}
      >
        <div className="absolute inset-0 bg-black/60" onClick={() => setIsSidebarOpen(false)}></div>
        <div className="relative w-[90%] max-w-xs h-full">
            <Sidebar 
              onClose={() => setIsSidebarOpen(false)}
              currentView={currentView}
              onNavigate={handleNavigate}
              chatHistory={chatHistory}
              activeChatId={activeChatId}
              onNewChat={handleNewChat}
              onSelectChat={handleSelectChat}
            />
        </div>
      </div>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="flex items-center justify-between p-4 border-b border-slate-700/50 flex-shrink-0">
          <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-slate-300">
              <MenuIcon className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold truncate">
            {getPageTitle()}
          </h1>
          <div className="w-6 lg:hidden"></div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {currentView === 'chat' && (
            <>
              {activeChat ? (
                <ChatPage
                  key={activeChatId}
                  messages={activeChat.messages}
                  onMessagesUpdate={handleUpdateMessages}
                  onNewKeywords={handleNewKeywords}
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center">
                    <ChatBubbleLeftRightIcon className="w-20 h-20 text-slate-700 mb-4"/>
                    <h2 className="text-2xl font-bold text-slate-300">Selamat Datang di Ahli Nahwu</h2>
                    <p className="mt-2 max-w-sm text-slate-400">
                        Pilih percakapan dari panel samping, atau mulai percakapan baru untuk menerjemahkan dan menganalisis teks Arab.
                    </p>
                    <button 
                        onClick={handleNewChat} 
                        className="mt-6 flex items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-sky-700"
                    >
                        <PlusIcon className="w-5 h-5" />
                        <span>Percakapan Baru</span>
                    </button>
                </div>
              )}
            </>
          )}

          {currentView === 'keywords' && (
            <KeywordsPage 
              keywords={savedKeywords}
              onClearKeywords={handleClearKeywords}
            />
          )}

        </div>
      </main>
    </div>
  );
}

export default App;