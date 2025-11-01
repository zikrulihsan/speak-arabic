
import React from 'react';
import { CloseIcon, PlusIcon, ChatBubbleLeftRightIcon, BookmarkIcon } from './icons';
import { ChatSession } from '../types';

type View = 'chat' | 'keywords';

interface SidebarProps {
  onClose: () => void; // For mobile view
  currentView: View;
  onNavigate: (view: View) => void;
  chatHistory: ChatSession[];
  activeChatId: string | null;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
}

const NavItem: React.FC<{
    label: string;
    isActive: boolean;
    onClick: () => void;
    icon: React.ReactNode;
}> = ({ label, isActive, onClick, icon }) => (
    <button onClick={onClick} className={`flex items-center gap-3 w-full text-left px-3 py-2 text-sm rounded-md ${
        isActive ? 'bg-slate-700 text-white font-semibold' : 'text-slate-400 hover:bg-slate-800'
    }`}>
        {icon}
        <span>{label}</span>
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


const Sidebar: React.FC<SidebarProps> = ({ onClose, currentView, onNavigate, chatHistory, activeChatId, onNewChat, onSelectChat }) => {
  return (
    <div className="bg-slate-900/80 backdrop-blur-md h-full flex flex-col p-2 gap-2">
      <header className="flex items-center justify-between p-2 pb-3">
        <h1 className="text-xl font-bold text-white">Speaking Arabic</h1>
        <button onClick={onClose} className="lg:hidden p-1 text-slate-400 hover:text-white">
          <CloseIcon className="w-6 h-6" />
        </button>
      </header>

      <nav className="flex flex-col gap-1 border-b border-slate-700 pb-3 mb-2">
        <NavItem 
            label="Percakapan"
            icon={<ChatBubbleLeftRightIcon className="w-5 h-5"/>}
            isActive={currentView === 'chat'}
            onClick={() => onNavigate('chat')}
        />
        <NavItem 
            label="Daftar Kata Kunci"
            icon={<BookmarkIcon className="w-5 h-5"/>}
            isActive={currentView === 'keywords'}
            onClick={() => onNavigate('keywords')}
        />
      </nav>

      {currentView === 'chat' && (
        <div className="flex flex-col flex-1 overflow-hidden">
            <button onClick={onNewChat} className="flex-shrink-0 flex items-center justify-center gap-2 w-full px-3 py-2 mb-2 rounded-lg text-sm font-semibold text-slate-200 bg-slate-700/50 hover:bg-slate-700 transition-colors">
                <PlusIcon className="w-5 h-5" />
                <span>Percakapan Baru</span>
            </button>
            <p className="px-3 text-xs text-slate-500 font-semibold mb-2">Riwayat</p>
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