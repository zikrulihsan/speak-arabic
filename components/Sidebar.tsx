import React from 'react';
import { BookmarkIcon, ChatBubbleLeftRightIcon, CloseIcon } from './icons';

type View = 'chat' | 'keywords';

interface SidebarProps {
  currentView: View;
  onNavigate: (view: View) => void;
  onClose: () => void; // For mobile view
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

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, onClose }) => {
  return (
    <div className="bg-slate-900/80 backdrop-blur-md h-full flex flex-col p-4 gap-4">
      <header className="flex items-center justify-between pb-3 border-b border-slate-700">
        <h1 className="text-xl font-bold text-white">Ahli Nahwu</h1>
        <button onClick={onClose} className="lg:hidden p-1 text-slate-400 hover:text-white">
          <CloseIcon className="w-6 h-6" />
        </button>
      </header>
      
      <nav className="flex-1">
        <ul className="space-y-2">
          <li>
            <NavItem
              icon={<ChatBubbleLeftRightIcon className="w-6 h-6"/>}
              label="Percakapan"
              isActive={currentView === 'chat'}
              onClick={() => onNavigate('chat')}
            />
          </li>
          <li>
            <NavItem
              icon={<BookmarkIcon className="w-6 h-6"/>}
              label="Daftar Kata Kunci"
              isActive={currentView === 'keywords'}
              onClick={() => onNavigate('keywords')}
            />
          </li>
        </ul>
      </nav>

      <footer className="text-center text-xs text-slate-500">
        <p>Ditenagai oleh Gemini</p>
      </footer>
    </div>
  );
};

export default Sidebar;
