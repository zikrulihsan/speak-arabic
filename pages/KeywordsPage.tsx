
import React, { useState } from 'react';
import type { SavedKeyword } from '../types';
import KeywordCard from '../components/KeywordCard';
import { TrashIcon, BookmarkIcon } from '../components/icons';

interface KeywordsPageProps {
  keywords: SavedKeyword[];
  onClearKeywords: () => void;
}

const KeywordsPage: React.FC<KeywordsPageProps> = ({ keywords, onClearKeywords }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredKeywords = keywords.filter(k =>
    k.indonesian.toLowerCase().includes(searchTerm.toLowerCase()) ||
    k.arabic.toLowerCase().includes(searchTerm.toLowerCase()) ||
    k.translit.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 h-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <input
          type="text"
          placeholder="Cari kata kunci..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-72 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
        <button
          onClick={() => {
            if (window.confirm('Apakah Anda yakin ingin menghapus semua kata kunci?')) {
              onClearKeywords();
            }
          }}
          disabled={keywords.length === 0}
          className="flex items-center justify-center gap-2 rounded-lg bg-red-600/80 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:bg-slate-600 disabled:cursor-not-allowed"
        >
          <TrashIcon className="w-4 h-4" />
          <span>Hapus Semua</span>
        </button>
      </div>

      {keywords.length === 0 ? (
        <div className="flex h-[calc(100%-100px)] w-full flex-col items-center justify-center text-center p-4">
            <BookmarkIcon className="w-20 h-20 text-slate-700 mb-4"/>
            <h2 className="text-2xl font-bold text-slate-300">Daftar Kata Kunci Kosong</h2>
            <p className="mt-2 max-w-sm text-slate-400">
                Gunakan "Mode Terjemah" di halaman percakapan untuk mengekstrak dan menyimpan kata kunci secara otomatis.
            </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredKeywords.map((keyword, index) => (
            <KeywordCard key={`${keyword.indonesian}-${index}`} keyword={keyword} />
          ))}
          {filteredKeywords.length === 0 && (
            <p className="text-center text-slate-400 pt-8">Tidak ada kata kunci yang cocok dengan pencarian Anda.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default KeywordsPage;