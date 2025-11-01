
import React, { useState } from 'react';
import { CloseIcon, PlusIcon, ChatBubbleLeftRightIcon, BookmarkIcon, KeyIcon } from './icons';
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
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  isUsingEnvKey: boolean;
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


const Sidebar: React.FC<SidebarProps> = ({ onClose, currentView, onNavigate, chatHistory, activeChatId, onNewChat, onSelectChat, apiKey, onApiKeyChange, isUsingEnvKey }) => {
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');

  const handleOpenApiKeyModal = () => {
    setTempApiKey(apiKey);
    setShowApiKeyModal(true);
  };

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempApiKey.trim()) {
      onApiKeyChange(tempApiKey.trim());
      setShowApiKeyModal(false);
    }
  };

  const handleClearApiKey = () => {
    setTempApiKey('');
    onApiKeyChange('');
    setShowApiKeyModal(false);
  };

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
        <NavItem
            label="API Key Settings"
            icon={<KeyIcon className="w-5 h-5"/>}
            isActive={false}
            onClick={handleOpenApiKeyModal}
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

      {/* API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowApiKeyModal(false)}>
          <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Pengaturan API Key</h2>
              <button onClick={() => setShowApiKeyModal(false)} className="text-slate-400 hover:text-white">
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            {isUsingEnvKey ? (
              <div className="bg-slate-900 border border-slate-700 rounded-md p-4 mb-4">
                <p className="text-sm text-slate-300">
                  API Key saat ini menggunakan environment variable. Anda tidak dapat mengubahnya dari aplikasi.
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  Status: <span className="text-green-400">Aktif (Environment)</span>
                </p>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  {apiKey ? (
                    <div className="bg-slate-900 border border-slate-700 rounded-md p-3 mb-3">
                      <p className="text-xs text-slate-500 mb-1">API Key Saat Ini:</p>
                      <p className="text-sm text-slate-300 font-mono truncate">
                        {apiKey.substring(0, 20)}...{apiKey.substring(apiKey.length - 4)}
                      </p>
                      <p className="text-xs text-green-400 mt-2">Status: Aktif</p>
                    </div>
                  ) : (
                    <div className="bg-slate-900 border border-slate-700 rounded-md p-3 mb-3">
                      <p className="text-sm text-slate-400">Belum ada API Key yang tersimpan</p>
                    </div>
                  )}

                  <form onSubmit={handleSaveApiKey}>
                    <label className="block text-sm text-slate-300 mb-2">
                      {apiKey ? 'Ganti API Key Baru:' : 'Masukkan API Key:'}
                    </label>
                    <input
                      type="password"
                      value={tempApiKey}
                      onChange={(e) => setTempApiKey(e.target.value)}
                      placeholder="Masukkan Gemini API Key..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500 mb-3"
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={!tempApiKey.trim()}
                        className="flex-1 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold py-2 rounded-lg transition-colors"
                      >
                        {apiKey ? 'Update API Key' : 'Simpan API Key'}
                      </button>
                      {apiKey && (
                        <button
                          type="button"
                          onClick={handleClearApiKey}
                          className="px-4 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg transition-colors"
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                  </form>

                  <p className="text-xs text-slate-500 mt-3">
                    API Key disimpan di browser dan tidak dikirim ke server manapun.
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-700 rounded-md p-3">
                  <p className="text-xs text-sky-400 font-semibold mb-2">Cara mendapatkan API Key:</p>
                  <ol className="text-xs text-slate-400 space-y-1 list-decimal list-inside">
                    <li>Kunjungi <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline">Google AI Studio</a></li>
                    <li>Login dengan akun Google</li>
                    <li>Klik "Create API Key"</li>
                    <li>Salin dan tempel di sini</li>
                  </ol>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;