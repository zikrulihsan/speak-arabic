import React, { useState } from 'react';
import { marked } from 'marked';
import type { SavedKeyword, ArabicWithTranslit } from '../types';
import { ChevronDownIcon, LightBulbIcon } from './icons';
import { explainGrammarConcept } from '../services/geminiService';


interface KeywordCardProps {
  keyword: SavedKeyword;
}

const KeywordCard: React.FC<KeywordCardProps> = ({ keyword }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [explanationLoading, setExplanationLoading] = useState<boolean>(false);
  const [activeExplanation, setActiveExplanation] = useState<string | null>(null);

  const handleExplain = async (concept: string, word: ArabicWithTranslit) => {
    if (activeExplanation === concept) {
      setActiveExplanation(null);
      setExplanation(null);
      return;
    }
    setActiveExplanation(concept);
    setExplanationLoading(true);
    setExplanation(null);
    try {
        const result = await explainGrammarConcept(concept, word);
        setExplanation(result);
    } catch (error) {
        setExplanation("Gagal memuat penjelasan.");
    } finally {
        setExplanationLoading(false);
    }
  };

  const renderDetailRow = (label: string, value: ArabicWithTranslit, conceptKey: string) => {
    return (
      <div key={conceptKey} className="py-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-400">{label}</span>
          <div className="flex items-center gap-3">
            <div className="text-right font-mono">
              <span className="text-slate-200" lang="ar" dir="rtl">{value.arabic}</span>
              <br />
              <span className="text-xs text-slate-500 italic">({value.translit})</span>
            </div>
            <button
              onClick={() => handleExplain(label, value)}
              title={`Jelaskan konsep ${label}`}
              className="p-1.5 rounded-full bg-sky-800/60 hover:bg-sky-700 text-sky-300 transition-colors"
            >
              <LightBulbIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
        {activeExplanation === label && (
          <div className="mt-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700">
            {explanationLoading && <p className="text-slate-400 text-sm animate-pulse">Memuat penjelasan...</p>}
            {explanation && !explanationLoading && (
              <div
                className="prose prose-sm prose-invert prose-p:text-slate-300 prose-strong:text-white prose-headings:text-sky-300"
                dangerouslySetInnerHTML={{ __html: marked(explanation) as string }}
              />
            )}
          </div>
        )}
      </div>
    );
  };


  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700/50 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex justify-between items-center p-4 text-left"
      >
        <div>
          <h3 className="font-semibold text-white">{keyword.indonesian}</h3>
          <p className="text-slate-400 text-sm" lang="ar" dir="rtl">
            {keyword.translation.arabic} ({keyword.translation.translit})
          </p>
        </div>
        <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase bg-sky-800/50 text-sky-300 px-2 py-1 rounded-full">{keyword.type}</span>
            <ChevronDownIcon className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-slate-700/50">
          <div className="mt-1 divide-y divide-slate-700/50">
            {keyword.type === 'fi\'il' && (
              keyword.verbForms ? (
                <>
                  {keyword.root && renderDetailRow("Akar Kata", keyword.root, "root")}
                  {renderDetailRow("Madhi (Lampau)", keyword.verbForms.madhi, "madhi")}
                  {renderDetailRow("Mudhari' (Kini)", keyword.verbForms.mudhari, "mudhari")}
                  {renderDetailRow("Amr (Perintah)", keyword.verbForms.amr, "amr")}
                </>
              ) : (
                 <p className="text-sm text-slate-500 italic py-4 text-center">Detail bentuk kata kerja tidak tersedia.</p>
              )
            )}
            {keyword.type === 'isim' && (
              keyword.nounForms ? (
                <>
                  {renderDetailRow("Mufrad (Tunggal)", keyword.nounForms.singular, "singular")}
                  {renderDetailRow("Jamak (Plural)", keyword.nounForms.plural, "plural")}
                </>
              ) : (
                <p className="text-sm text-slate-500 italic py-4 text-center">Detail bentuk kata benda tidak tersedia.</p>
              )
            )}
             {keyword.type === 'lainnya' && (
                <p className="text-sm text-slate-400 text-center italic py-4">Tidak ada detail sharaf untuk tipe kata ini.</p>
             )}
          </div>
        </div>
      )}
    </div>
  );
};

export default KeywordCard;