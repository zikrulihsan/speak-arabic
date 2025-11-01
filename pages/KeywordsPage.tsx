import React, { useState, useMemo } from 'react';
import { SavedKeyword } from '../types';
import KeywordCard from '../components/KeywordCard';
import { TrashIcon, BookmarkIcon } from '../components/icons';

interface KeywordsPageProps {
  keywords: SavedKeyword[];
  onClear: () => void;
}

const KeywordsPage: React.FC<KeywordsPageProps> = ({ keywords, onClear }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

  const filteredKeywords = useMemo(() => {
    if (!searchQuery.trim()) {
      return keywords;
    }
    const lowercasedQuery = searchQuery.toLowerCase();
    return keywords.filter(
      (kw) =>
        kw.indonesian.toLowerCase().includes(lowercasedQuery) ||
        kw.arabic.arabic.toLowerCase().includes(lowercasedQuery) ||
        kw.arabic.translit.toLowerCase().includes(lowercasedQuery)
    );
  }, [keywords, searchQuery]);

  const toggleCard = (index: number) => {
    setExpandedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  return (
    <div className="h-full w-full flex flex-col p-4 sm:p-6 lg:p-8">
      {/* Page-specific controls */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4 flex-shrink-0">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kata kunci..."
            className="w-full md:w-auto md:flex-1 max-w-lg bg-slate-800 rounded-lg p-3 px-4 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-200 placeholder:text-slate-500"
          />
        {keywords.length > 0 && (
          <button
            onClick={onClear}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold transition-colors flex-shrink-0"
            aria-label="Hapus semua kata kunci"
          >
            <TrashIcon className="w-5 h-5" />
            <span>Hapus Semua</span>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
        {filteredKeywords.length > 0 ? (
            <div className="space-y-3">
                {filteredKeywords.map((kw, index) => (
                    <KeywordCard 
                        key={`${kw.indonesian}-${index}`}
                        keyword={kw}
                        isExpanded={expandedCards.has(index)}
                        onToggle={() => toggleCard(index)}
                    />
                ))}
            </div>
        ) : (
             <div className="flex-1 flex h-full flex-col items-center justify-center text-slate-500 text-center">
                <BookmarkIcon className="w-20 h-20 text-slate-700 mb-4"/>
                <h3 className="text-xl font-semibold text-slate-400">
                    {keywords.length === 0 ? "Belum Ada Kata Kunci" : "Tidak Ada Hasil"}
                </h3>
                <p className="mt-2 max-w-sm">
                    {keywords.length === 0 
                    ? "Kata kunci yang Anda simpan dari percakapan akan muncul di sini."
                    : "Tidak ada kata kunci yang cocok dengan pencarian Anda."}
                </p>
            </div>
        )}
      </div>
    </div>
  );
};

export default KeywordsPage;