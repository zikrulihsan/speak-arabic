
import React, { useState, useRef, useEffect } from 'react';
import type { Chat } from '@google/genai';
import { startFastTranslationSession, extractKeywords, startGeneralChatSession } from '../services/geminiService';
import type { ChatMessage, ChatMode, SavedKeyword, AiMessageData } from '../types';
import { MessageAuthor } from '../types';
import ChatMessageComponent from '../components/ChatMessage';
import { SendIcon, BotIcon } from '../components/icons';

interface ChatPageProps {
    messages: ChatMessage[];
    onMessagesUpdate: (updater: (prevMessages: ChatMessage[]) => ChatMessage[]) => void;
    onNewKeywords: (keywords: SavedKeyword[]) => void;
}

const ChatPage: React.FC<ChatPageProps> = ({ messages, onMessagesUpdate, onNewKeywords }) => {
    const [translateSession, setTranslateSession] = useState<Chat | null>(null);
    const [askSession, setAskSession] = useState<Chat | null>(null);
    const [chatMode, setChatMode] = useState<ChatMode>('translate');
    
    const [userInput, setUserInput] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    
    const chatHistoryRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const geminiHistory = messages.map(msg => ({
            role: msg.author === MessageAuthor.USER ? 'user' : 'model',
            parts: [{ text: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content) }]
        }));
        // Note: For fast translation, we don't need persistent history in the session object itself,
        // as we manage history in our own state. New sessions can be created for each message.
        setAskSession(startGeneralChatSession(geminiHistory));
    }, [messages]);

    useEffect(() => {
        if (chatHistoryRef.current) {
            chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || isLoading) return;

        const userMessage: ChatMessage = { id: Date.now().toString(), author: MessageAuthor.USER, content: userInput };
        const currentInput = userInput;
        setUserInput('');
        setIsLoading(true);

        onMessagesUpdate(prev => [...prev, userMessage]);

        try {
            if (chatMode === 'translate') {
                // Step 1: Get fast translation
                const fastSession = startFastTranslationSession();
                const response = await fastSession.sendMessage({ message: currentInput });
                const jsonText = response.text.trim();
                const fastData: Omit<AiMessageData, 'keywords' | 'keywordsLoading'> = JSON.parse(jsonText);

                // Step 2: Display the fast translation immediately
                const aiMessageId = (Date.now() + 1).toString();
                const initialAiMessage: ChatMessage = { 
                    id: aiMessageId, 
                    author: MessageAuthor.AI, 
                    content: { ...fastData, keywords: [], keywordsLoading: true } 
                };
                onMessagesUpdate(prev => [...prev, initialAiMessage]);
                setIsLoading(false); // Stop the main loading indicator

                // Step 3: Trigger keyword extraction in the background
                const extractedKeywords = await extractKeywords(currentInput);
                
                // Save the keywords to the global state
                if (extractedKeywords.length > 0) {
                    onNewKeywords(extractedKeywords);
                }

                // Step 4: Update the message with the extracted keywords
                onMessagesUpdate(prev => prev.map(msg => {
                    if (msg.id === aiMessageId && typeof msg.content === 'object') {
                        return { 
                            ...msg, 
                            content: { 
                                ...msg.content, 
                                keywords: extractedKeywords, 
                                keywordsLoading: false 
                            } 
                        };
                    }
                    return msg;
                }));
                
            } else { // 'ask' mode
                if (!askSession) throw new Error("Ask session not initialized");
                
                let fullResponseText = '';
                const responseStream = await askSession.sendMessageStream({ message: currentInput });
                
                const aiMessageId = (Date.now() + 1).toString();
                const streamingAiMessage: ChatMessage = { id: aiMessageId, author: MessageAuthor.AI, content: '' };
                onMessagesUpdate(prev => [...prev, streamingAiMessage]);

                for await (const chunk of responseStream) {
                    fullResponseText += chunk.text;
                    onMessagesUpdate(prev => prev.map(msg => 
                        msg.id === aiMessageId ? { ...msg, content: fullResponseText } : msg
                    ));
                }
                setIsLoading(false);
            }

        } catch (error) {
            console.error("Error processing message:", error);
            const errorMessage: ChatMessage = { id: Date.now().toString(), author: MessageAuthor.AI, content: "Maaf, terjadi kesalahan. Pastikan format output dari model sesuai atau periksa koneksi Anda." };
            onMessagesUpdate(prev => [...prev, errorMessage]);
            setIsLoading(false);
        }
    };
    
    const handleExampleClick = (text: string) => {
        setChatMode('translate');
        setUserInput(text);
        inputRef.current?.focus();
    };

    const renderInputForm = ({ maxWidthClass = 'max-w-4xl' }: { maxWidthClass?: string }) => (
        <div className={`${maxWidthClass} mx-auto w-full`}>
            {messages.length > 0 && (
                <div className="flex items-center justify-center gap-2 p-1 bg-slate-800 rounded-lg mb-4">
                    <button 
                        onClick={() => setChatMode('translate')}
                        className={`flex-1 py-2 rounded-md text-sm font-semibold transition-colors ${chatMode === 'translate' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
                    >
                        Mode Terjemah
                    </button>
                    <button 
                        onClick={() => setChatMode('ask')}
                        disabled={messages.length === 0}
                        className={`flex-1 py-2 rounded-md text-sm font-semibold transition-colors ${chatMode === 'ask' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:bg-slate-700'} disabled:opacity-50 disabled:cursor-not-allowed`}
                        title={messages.length === 0 ? "Kirim pesan pertama untuk mengaktifkan Mode Tanya" : "Beralih ke Mode Tanya"}
                    >
                        Mode Tanya
                    </button>
                </div>
            )}

            <form onSubmit={handleSendMessage} className="flex items-center gap-4 bg-slate-800 rounded-xl p-2 pl-5">
                <input
                    ref={inputRef}
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder={chatMode === 'translate' ? 'Terjemahkan (respons cepat)...' : 'Tanyakan apa saja...'}
                    className="flex-1 bg-transparent focus:outline-none text-slate-200 placeholder:text-slate-500"
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    disabled={isLoading || !userInput.trim()}
                    className="p-3 bg-sky-600 rounded-lg hover:bg-sky-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
                    aria-label="Kirim pesan"
                >
                    <SendIcon className="w-6 h-6 text-white" />
                </button>
            </form>
        </div>
    );
    
    if (messages.length === 0 && !isLoading) {
        return (
            <div className="h-full w-full flex flex-col justify-center items-center p-6">
                <div className="w-full flex flex-col items-center">
                     <BotIcon className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                     <h2 className="text-3xl font-bold text-slate-300 text-center">Penerjemah Arab & Ahli Nahwu</h2>
                     <p className="mt-4 text-slate-400 max-w-lg text-center">Mulai percakapan baru dengan menerjemahkan kalimat dari Bahasa Indonesia ke Bahasa Arab.</p>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-10 text-left w-full max-w-2xl mx-auto">
                        <div className="bg-slate-800 p-4 rounded-lg hover:bg-slate-700/50 transition-colors cursor-pointer" onClick={() => handleExampleClick('Saya sedang belajar bahasa Arab sekarang')}>
                             <h3 className="font-semibold text-slate-400 text-sm">Contoh 1</h3>
                             <p className="text-slate-200 mt-1">
                              Saya sedang belajar bahasa Arab sekarang
                            </p>
                        </div>
                        <div className="bg-slate-800 p-4 rounded-lg hover:bg-slate-700/50 transition-colors cursor-pointer" onClick={() => handleExampleClick('Di mana buku saya?')}>
                            <h3 className="font-semibold text-slate-400 text-sm">Contoh 2</h3>
                            <p className="text-slate-200 mt-1">
                              Di mana buku saya?
                            </p>
                        </div>
                    </div>
                    
                    <div className="w-full mt-10">
                        {renderInputForm({ maxWidthClass: 'max-w-2xl' })}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full flex flex-col">
            <div ref={chatHistoryRef} className="flex-1 p-6 space-y-6 overflow-y-auto custom-scrollbar">
                {messages.map((msg) => (
                    <ChatMessageComponent
                        key={msg.id}
                        message={msg}
                        onBookmarkKeywords={onNewKeywords}
                    />
                ))}
                {isLoading && (
                    <div className="flex items-start gap-4">
                        <BotIcon className="w-8 h-8 flex-shrink-0 text-sky-400 mt-1 animate-pulse" />
                        <div className="max-w-2xl px-5 py-4 rounded-2xl bg-slate-700">
                           <p className="text-sm text-slate-400">Mendapatkan terjemahan...</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-6 bg-slate-900/50 backdrop-blur-sm flex-shrink-0">
                {renderInputForm({})}
            </div>
        </div>
    );
};

export default ChatPage;