
import React from 'react';
import { BookmarkIcon, ChatBubbleLeftRightIcon, CloseIcon, PlusIcon } from './icons';
import { ChatSession } from '../types';

type View = 'chat' | 'keywords';

interface SidebarProps {
  currentView: View;
  onNavigate: (view: View) => void;
  onClose: () => void; // For mobile view
  chatHistory: ChatSession[];
  activeChatId: string | null;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
      isActive ? 'bg-sky-500/20 text-sky-300' : 'text-slate-300 hover:bg-slate-700/50'
    }`}
  >
    {icon}
    <span className="font-semibold">{label}</span>
  </button>
);

const HistoryItem: React.FC<{
    label: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ label, isActive, onClick }) => (
    <button onClick={onClick} className={`w-full text-left px-3 py-2 text-sm truncate rounded-md ${
        isActive ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-800'
    }`}>
        {label}
    </button>
);


const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, onClose, chatHistory, activeChatId, onNewChat, onSelectChat }) => {
  return (
    <div className="bg-slate-900/80 backdrop-blur-md h-full flex flex-col p-2 gap-2">
      <header className="flex items-center justify-between p-2 pb-3 border-b border-slate-700">
        <h1 className="text-xl font-bold text-white">Ahli Nahwu</h1>
        <button onClick={onClose} className="lg:hidden p-1 text-slate-400 hover:text-white">
          <CloseIcon className="w-6 h-6" />
        </button>
      </header>
      
      <nav className="flex flex-col gap-2">
        <NavItem
          icon={<ChatBubbleLeftRightIcon className="w-5 h-5"/>}
          label="Percakapan"
          isActive={currentView === 'chat'}
          onClick={() => onNavigate('chat')}
        />
        <NavItem
          icon={<BookmarkIcon className="w-5 h-5"/>}
          label="Daftar Kata Kunci"
          isActive={currentView === 'keywords'}
          onClick={() => onNavigate('keywords')}
        />
      </nav>

      {currentView === 'chat' && (
          <div className="flex flex-col flex-1 overflow-hidden border-t border-slate-700 pt-2">
            <button onClick={onNewChat} className="flex-shrink-0 flex items-center justify-center gap-2 w-full px-3 py-2 mb-2 rounded-lg text-sm font-semibold text-slate-200 bg-slate-700/50 hover:bg-slate-700 transition-colors">
                <PlusIcon className="w-5 h-5" />
                <span>Percakapan Baru</span>
            </button>
            <div className="flex-1 overflow-y-auto space-y-1 pr-1">
                {chatHistory.map(session => (
                    <HistoryItem
                        key={session.id}
                        label={session.title}
                        isActive={session.id === activeChatId}
                        onClick={() => onSelectChat(session.id)}
                    />
                ))}
            </div>
        </div>
      )}


      <footer className="text-center text-xs text-slate-500 mt-auto pb-2">
        <p>Ditenagai oleh Gemini</p>
      </footer>
    </div>
  );
};

export default Sidebar;
