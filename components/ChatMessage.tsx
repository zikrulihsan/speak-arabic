
import React, { useState } from 'react';
import { marked } from 'marked';
import { ChatMessage, MessageAuthor, AiMessageData, SavedKeyword, ArabicWithTranslit } from '../types';
import { UserIcon, BotIcon, BookmarkIcon, SpeakerIcon, LightBulbIcon } from './icons';
import { generateSpeech, explainGrammarConcept } from '../services/geminiService';
import { decode, decodeAudioData } from '../utils/audioUtils';

interface ChatMessageProps {
  message: ChatMessage;
  onBookmarkKeywords?: (keywords: SavedKeyword[]) => void;
}

const ChatMessageComponent: React.FC<ChatMessageProps> = ({ message, onBookmarkKeywords }) => {
  const isUser = message.author === MessageAuthor.USER;
  const { content } = message;

  const [isBookmarked, setIsBookmarked] = useState(false);
  const [ttsState, setTtsState] = useState<'idle' | 'loading' | 'playing' | 'error'>('idle');
  
  // State for inline explanations
  const [activeExplanation, setActiveExplanation] = useState<number | null>(null);
  const [explanationLoading, setExplanationLoading] = useState<boolean>(false);
  const [explanationContent, setExplanationContent] = useState<string | null>(null);

  const handleBookmark = (keywords: SavedKeyword[]) => {
    if (onBookmarkKeywords) {
      onBookmarkKeywords(keywords);
      setIsBookmarked(true);
    }
  };

  const handlePlayTts = async (text: string) => {
    if (ttsState === 'loading' || ttsState === 'playing') return;
    setTtsState('loading');
    try {
      const audioContent = await generateSpeech(text);
      if (!audioContent) {
        throw new Error("No audio content received from API.");
      }

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const decodedBytes = decode(audioContent);
      const audioBuffer = await decodeAudioData(decodedBytes, audioContext, 24000, 1);
      
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.onended = () => {
        setTtsState('idle');
        audioContext.close();
      };
      source.start();
      setTtsState('playing');

    } catch (error) {
      console.error("Error playing TTS:", error);
      setTtsState('error');
      setTimeout(() => setTtsState('idle'), 2000);
    }
  };
  
  const handleExplain = async (index: number, concept: string, word: ArabicWithTranslit) => {
    if (activeExplanation === index) {
      setActiveExplanation(null);
      setExplanationContent(null);
      return;
    }
    setActiveExplanation(index);
    setExplanationLoading(true);
    setExplanationContent(null);
    try {
        const result = await explainGrammarConcept(concept, word);
        setExplanationContent(result);
    } catch (error) {
        setExplanationContent("Gagal memuat penjelasan.");
    } finally {
        setExplanationLoading(false);
    }
  };

  const renderAiMessageData = (data: AiMessageData) => {
    const keywordsAvailable = data.keywords && data.keywords.length > 0;
    
    return (
      <div className="flex flex-col gap-3 text-left">
        <div className="text-right">
          <p className="text-2xl" dir="rtl" lang="ar">{data.arabic || ''}</p>
          <p className="italic text-slate-400 font-mono text-sm">{data.translit || ''}</p>
        </div>
        <div className="border-t border-slate-600/50 my-1"></div>
        <div>
          <h3 className="text-md font-semibold text-sky-300 mb-2">Penjelasan:</h3>
          <div className="space-y-1">
            {data.explanation.map((exp, index) => (
              <div key={index} className="py-1">
                <div className="flex justify-between items-center gap-2">
                  <p className="text-slate-300 flex-1">
                    <span className="font-semibold" lang="ar" dir="rtl">{exp.arabic}</span>
                    <span className="italic text-slate-400 font-mono text-sm mx-2">{exp.translit}</span>
                    = {exp.indonesian}
                  </p>
                  <button
                    onClick={() => handleExplain(index, exp.indonesian, { arabic: exp.arabic, translit: exp.translit })}
                    title={`Jelaskan kata "${exp.indonesian}"`}
                    className="p-1.5 rounded-full bg-slate-600/50 hover:bg-slate-600 text-sky-300 transition-colors flex-shrink-0"
                  >
                    <LightBulbIcon className="w-4 h-4" />
                  </button>
                </div>
                {activeExplanation === index && (
                  <div className="mt-2 p-3 bg-slate-800/50 rounded-lg border border-slate-600/50">
                    {explanationLoading && <p className="text-slate-400 text-sm animate-pulse">Memuat penjelasan...</p>}
                    {explanationContent && !explanationLoading && (
                      <div
                        className="prose prose-sm prose-invert prose-p:text-slate-300 prose-strong:text-white prose-headings:text-sky-300"
                        dangerouslySetInnerHTML={{ __html: marked(explanationContent) as string }}
                      />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div className="border-t border-slate-600/50 pt-3 mt-2 flex items-center gap-2">
          <button 
            onClick={() => handleBookmark(data.keywords || [])}
            disabled={isBookmarked || data.keywordsLoading || !keywordsAvailable}
            className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-md bg-slate-600/50 text-slate-300 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <BookmarkIcon className="w-4 h-4" />
            <span>
              {isBookmarked ? 'Disimpan' :
               data.keywordsLoading ? 'Memuat kata kunci...' :
               'Bookmark Kata Kunci'}
            </span>
          </button>
          <button
            onClick={() => handlePlayTts(data.arabic)}
            disabled={ttsState === 'loading' || ttsState === 'playing'}
            className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-md bg-slate-600/50 text-slate-300 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <SpeakerIcon className="w-4 h-4" />
            <span>
              {ttsState === 'loading' && 'Memuat...'}
              {ttsState === 'playing' && 'Memutar...'}
              {ttsState === 'idle' && 'Dengarkan'}
              {ttsState === 'error' && 'Gagal'}
            </span>
          </button>
        </div>
      </div>
    );
  };
  
  const isAiMessageData = typeof content === 'object' && content !== null && 'arabic' in content;

  return (
    <div className={`flex items-start gap-4 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && <BotIcon className="w-8 h-8 flex-shrink-0 text-sky-400 mt-1" />}
      <div className={`max-w-2xl px-5 py-4 rounded-2xl ${isUser ? 'bg-sky-600' : 'bg-slate-700'}`}>
        {isUser ? (
          <p className="whitespace-pre-wrap">{content as string}</p>
        ) : isAiMessageData ? (
          renderAiMessageData(content as AiMessageData)
        ) : (
          <div
            className="prose prose-invert prose-p:text-slate-300 prose-strong:text-white"
            dangerouslySetInnerHTML={{ __html: marked(content as string) as string }}
          />
        )}
      </div>
      {isUser && <UserIcon className="w-8 h-8 flex-shrink-0 text-slate-400 mt-1" />}
    </div>
  );
};

export default ChatMessageComponent;
