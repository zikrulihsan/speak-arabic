import React, { useState } from 'react';
import { marked } from 'marked';
import type { SavedKeyword } from '../types';
import { ChevronDownIcon } from './icons';
import { explainKeywordDetail } from '../services/geminiService';


interface KeywordCardProps {
  keyword: SavedKeyword;
}

const KeywordCard: React.FC<KeywordCardProps> = ({ keyword }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleToggleExpand = async () => {
    console.log("masuk sini", isExpanded)
    if (!isExpanded) {
      // Expanding - generate explanation if not already loaded
      if (!explanation && !loadingExplanation && !hasError) {
        setLoadingExplanation(true);
        setHasError(false);
        try {
          // Generate detailed explanation using Gemini
          const result = await explainKeywordDetail(
            keyword.indonesian,
            keyword.translation.arabic,
            keyword.translation.translit
          );
          setExplanation(result);
        } catch (error) {
          console.error('Error generating keyword explanation:', error);
          setHasError(true);
        } finally {
          setLoadingExplanation(false);
        }
      }
    }
    setIsExpanded(!isExpanded);
  };

  const handleRetry = async () => {
    setHasError(false);
    setLoadingExplanation(true);
    try {
      const result = await explainKeywordDetail(
        keyword.indonesian,
        keyword.translation.arabic,
        keyword.translation.translit
      );
      setExplanation(result);
    } catch (error) {
      console.error('Error generating keyword explanation:', error);
      setHasError(true);
    } finally {
      setLoadingExplanation(false);
    }
  };


  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700/50 overflow-hidden">
      <button
        onClick={handleToggleExpand}
        className="w-full flex justify-between items-center p-4 text-left hover:bg-slate-700/30 transition-colors"
      >
        <div>
          <h3 className="font-semibold text-white">{keyword.indonesian}</h3>
          <p className="text-slate-400 text-sm" lang="ar" dir="rtl">
            {keyword.translation.arabic} <span className="text-slate-500">({keyword.translation.translit})</span>
          </p>
        </div>
        <ChevronDownIcon className={`w-5 h-5 text-slate-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-slate-700/50">
          {loadingExplanation ? (
            <div className="py-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
              <p className="mt-3 text-sm text-slate-400">Menganalisis kata...</p>
            </div>
          ) : hasError ? (
            <div className="py-8 text-center">
              <p className="text-sm text-slate-400 mb-3">Tidak dapat memuat penjelasan.</p>
              <button
                onClick={handleRetry}
                className="text-sm text-sky-400 hover:text-sky-300 underline"
              >
                Coba lagi
              </button>
            </div>
          ) : explanation ? (
            <div className="mt-3">
              <div
                className="prose prose-sm prose-invert prose-p:text-slate-300 prose-strong:text-white prose-headings:text-sky-300 prose-ul:text-slate-300 prose-li:text-slate-300"
                dangerouslySetInnerHTML={{ __html: marked(explanation) as string }}
              />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default KeywordCard;
