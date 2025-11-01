
import React from 'react';
import { marked } from 'marked';
import { AiMessageData, ChatMessage, MessageAuthor } from '../types';
import { UserIcon, BotIcon, SpeakerIcon, BookOpenIcon } from './icons';

interface ChatMessageProps {
  message: ChatMessage;
  messageIndex: number;
  onPlayAudio: (text: string) => void;
  onRequestDetails: (index: number) => void;
  isSpeaking: boolean;
  isDetailLoading: boolean;
  isLatestAiMessage: boolean;
}

const ChatMessageComponent: React.FC<ChatMessageProps> = ({ message, messageIndex, onPlayAudio, onRequestDetails, isSpeaking, isDetailLoading, isLatestAiMessage }) => {
  const isUser = message.author === MessageAuthor.USER;
  const content = message.content as (string | AiMessageData);

  const renderAiContent = (data: AiMessageData) => {
    const isDetailsAvailable = !!data.detailedExplanation;
    
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-lg font-semibold text-sky-300 mb-2">Terjemahan Arab</h3>
          <div className="flex items-center gap-3 bg-slate-800 p-3 rounded-lg">
             <button
              onClick={() => onPlayAudio(data.translation)}
              disabled={isSpeaking}
              className="p-2 rounded-full bg-sky-500 hover:bg-sky-600 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400"
              aria-label="Putar audio terjemahan"
            >
              {isSpeaking && isLatestAiMessage ? (
                 <div className="w-5 h-5 border-2 border-slate-900 border-t-white rounded-full animate-spin"></div>
              ) : (
                <SpeakerIcon className="w-5 h-5 text-white" />
              )}
            </button>
            <p className="text-2xl text-right flex-1" dir="rtl" lang="ar">{data.translation}</p>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-sky-300 mb-2">Penjelasan Singkat</h3>
          <p className="italic text-slate-400 font-mono" dir="ltr">{data.transliteration}</p>
          <p className="mt-2 text-slate-300">{data.briefExplanation}</p>
        </div>

        <div className="border-t border-slate-600/50 my-1"></div>

        {isDetailsAvailable ? (
          <div>
            <h3 className="text-lg font-semibold text-sky-300 mb-2">Penjelasan Rinci</h3>
            <div
              className="prose prose-invert prose-p:text-slate-300 prose-strong:text-sky-300 prose-ul:list-disc prose-li:text-slate-300"
              dangerouslySetInnerHTML={{ __html: marked(data.detailedExplanation as string) as string }}
            />
          </div>
        ) : (
          <button
            onClick={() => onRequestDetails(messageIndex)}
            disabled={isDetailLoading}
            className="flex items-center self-start gap-2 text-sky-400 hover:text-sky-300 disabled:text-slate-500 disabled:cursor-wait transition-colors font-semibold px-3 py-2 rounded-md hover:bg-sky-500/10"
          >
            {isDetailLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-500 border-t-sky-400 rounded-full animate-spin"></div>
                <span>Memuat Rincian...</span>
              </>
            ) : (
              <>
                <BookOpenIcon className="w-5 h-5" />
                <span>Lihat Penjelasan Rinci</span>
              </>
            )}
          </button>
        )}
      </div>
    );
  };
  
  return (
    <div className={`flex items-start gap-4 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && <BotIcon className="w-8 h-8 flex-shrink-0 text-sky-400 mt-1" />}
      <div className={`max-w-2xl px-5 py-4 rounded-2xl ${isUser ? 'bg-sky-600' : 'bg-slate-700'}`}>
        {typeof content === 'string' ? (
          <div 
            className="prose prose-invert prose-p:text-slate-300 prose-strong:text-white"
            dangerouslySetInnerHTML={{ __html: marked(content) as string }} 
          />
        ) : (
          renderAiContent(content)
        )}
      </div>
      {isUser && <UserIcon className="w-8 h-8 flex-shrink-0 text-slate-400 mt-1" />}
    </div>
  );
};

export default ChatMessageComponent;