import React from 'react';
import { SavedKeyword, ArabicWithTranslit } from '../types';
import { ChevronDownIcon } from './icons';

interface KeywordCardProps {
  keyword: SavedKeyword;
  isExpanded: boolean;
  onToggle: () => void;
}

const DetailRow: React.FC<{ label: string; data?: ArabicWithTranslit }> = ({ label, data }) => {
    if (!data || !data.arabic) return null;
    return (
        <div className="flex justify-between items-baseline">
            <span className="text-slate-400 text-sm">{label}</span>
            <div className="text-right">
                <p className="font-mono text-lg text-slate-300" dir="rtl">{data.arabic}</p>
                <p className="text-xs text-slate-500 font-mono -mt-1" dir="ltr">{data.translit}</p>
            </div>
        </div>
    );
};


const KeywordCard: React.FC<KeywordCardProps> = ({ keyword, isExpanded, onToggle }) => {
  const hasFiilDetails = keyword.root?.arabic || keyword.madhi?.arabic;
  const hasIsimDetails = keyword.singular?.arabic || keyword.plural?.arabic;

  return (
    <div className="bg-slate-800 rounded-lg overflow-hidden transition-all duration-300 ease-in-out">
      <button 
        onClick={onToggle}
        className="w-full flex justify-between items-center p-4 text-left"
        aria-expanded={isExpanded}
      >
        <div className="flex-1">
            <h3 className="font-bold text-slate-200 capitalize">{keyword.indonesian}</h3>
            <p className="text-xs text-slate-500 font-mono" dir="ltr">{keyword.arabic.translit}</p>
        </div>
        <div className="flex items-center gap-4">
             <p className="text-xl text-sky-400 text-right" dir="rtl" lang="ar">{keyword.arabic.arabic}</p>
            {(hasFiilDetails || hasIsimDetails) && (
                <ChevronDownIcon className={`w-6 h-6 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
            )}
        </div>
      </button>

      {/* Expandable Content */}
      <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-4 pb-4 pt-2 border-t border-slate-700/50">
            {hasFiilDetails && (
                <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-sky-300 mb-2">Bentuk Fi'il (Kata Kerja)</h4>
                    <DetailRow label="Akar Kata" data={keyword.root} />
                    <DetailRow label="Madhi (Lampau)" data={keyword.madhi} />
                    <DetailRow label="Mudhari' (Kini)" data={keyword.mudhari} />
                    <DetailRow label="Amr (Perintah)" data={keyword.amr} />
                </div>
            )}
            {hasIsimDetails && (
                 <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-sky-300 mb-2">Bentuk Isim (Kata Benda)</h4>
                    <DetailRow label="Mufrad (Tunggal)" data={keyword.singular} />
                    <DetailRow label="Jamak" data={keyword.plural} />
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default KeywordCard;
