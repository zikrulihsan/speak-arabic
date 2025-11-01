
import React, { useState, useRef, useEffect, SetStateAction } from 'react';
import type { Chat } from '@google/genai';
import { generateSpeech, startChatSession, getDetailedExplanation, startGeneralChatSession } from '../services/geminiService';
import type { ChatMessage, SavedKeyword, AiMessageData, ChatMode } from '../types';
import { MessageAuthor } from '../types';
import { decode, decodeAudioData } from '../utils/audioUtils';
import ChatMessageComponent from '../components/ChatMessage';
import { SendIcon, BotIcon } from '../components/icons';

interface ChatPageProps {
    messages: ChatMessage[];
    setMessages: (value: SetStateAction<ChatMessage[]>) => void;
    setSavedKeywords: (value: SetStateAction<SavedKeyword[]>) => void;
}

const ChatPage: React.FC<ChatPageProps> = ({ messages, setMessages, setSavedKeywords }) => {
    const [translateSession, setTranslateSession] = useState<Chat | null>(null);
    const [askSession, setAskSession] = useState<Chat | null>(null);
    const [chatMode, setChatMode] = useState<ChatMode>('translate');
    
    const [userInput, setUserInput] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
    const [detailLoadingIndex, setDetailLoadingIndex] = useState<number | null>(null);

    const audioContextRef = useRef<AudioContext | null>(null);
    const chatHistoryRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Initialize both chat sessions when component mounts
        setTranslateSession(startChatSession());
        setAskSession(startGeneralChatSession());
    }, []);
    
    useEffect(() => {
        // Pass message history to the sessions when it changes
        if (translateSession) {
            translateSession.history = messages.map(msg => ({
                role: msg.author === MessageAuthor.USER ? 'user' : 'model',
                parts: [{ text: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content) }]
            }));
        }
        if (askSession) {
             askSession.history = messages.map(msg => ({
                role: msg.author === MessageAuthor.USER ? 'user' : 'model',
                parts: [{ text: typeof msg.content === 'string' ? msg.content : (msg.content as AiMessageData).translation }]
            }));
        }
    }, [messages, translateSession, askSession]);

    useEffect(() => {
        if (!audioContextRef.current) {
            try {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            } catch (e) {
                console.error("Web Audio API is not supported in this browser.", e);
            }
        }
    }, []);

    useEffect(() => {
        if (chatHistoryRef.current) {
            chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || isLoading) return;

        const userMessage: ChatMessage = { author: MessageAuthor.USER, content: userInput };
        const currentInput = userInput;
        setUserInput('');
        setIsLoading(true);

        setMessages(prevMessages => [...prevMessages, userMessage]);

        try {
            if (chatMode === 'translate') {
                if (!translateSession) throw new Error("Translate session not initialized");
                let fullResponseText = '';
                const responseStream = await translateSession.sendMessageStream({ message: currentInput });

                for await (const chunk of responseStream) {
                    fullResponseText += chunk.text;
                }

                const finalResponseData: AiMessageData = JSON.parse(fullResponseText);
                const finalAiMessage: ChatMessage = { author: MessageAuthor.AI, content: finalResponseData };
                setMessages(prevMessages => [...prevMessages, finalAiMessage]);

                setSavedKeywords(prevKeywords => {
                    const newKeywords = finalResponseData.keywords.filter(
                        kw => !prevKeywords.some(pkw => pkw.indonesian.toLowerCase() === kw.indonesian.toLowerCase())
                    );
                    return [...prevKeywords, ...newKeywords];
                });

            } else { // 'ask' mode
                if (!askSession) throw new Error("Ask session not initialized");
                
                let fullResponseText = '';
                const responseStream = await askSession.sendMessageStream({ message: currentInput });

                // Add a placeholder message
                const placeholderMessage: ChatMessage = { author: MessageAuthor.AI, content: '' };
                const aiMessageIndex = messages.length + 1; // Index after user message
                setMessages(prev => [...prev, placeholderMessage]);

                for await (const chunk of responseStream) {
                    fullResponseText += chunk.text;
                    setMessages(prev => prev.map((msg, index) => 
                        index === aiMessageIndex ? { ...msg, content: fullResponseText } : msg
                    ));
                }
            }

        } catch (error) {
            console.error(error);
            const errorMessage: ChatMessage = { author: MessageAuthor.AI, content: "Maaf, terjadi kesalahan. Silakan coba lagi." };
            setMessages(prevMessages => [...prevMessages, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePlayAudio = async (text: string) => {
        if (!audioContextRef.current || isSpeaking) return;
        setIsSpeaking(true);
        try {
            const audioData = await generateSpeech(text);
            if (audioData) {
                const decodedBytes = decode(audioData);
                const audioBuffer = await decodeAudioData(decodedBytes, audioContextRef.current, 24000, 1);
                const source = audioContextRef.current.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(audioContextRef.current.destination);
                source.start();
                source.onended = () => setIsSpeaking(false);
            } else {
                setIsSpeaking(false);
            }
        } catch (error) {
            console.error("Error playing audio:", error);
            setIsSpeaking(false);
        }
    };

    const handleRequestDetails = async (messageIndex: number) => {
        setDetailLoadingIndex(messageIndex);
        const message = messages[messageIndex];
        const originalUserInput = messages[messageIndex - 1].content as string;
        const aiContent = message.content as AiMessageData;

        try {
            const detailedExplanation = await getDetailedExplanation(originalUserInput, aiContent.translation);
            const updatedAiContent = { ...aiContent, detailedExplanation };
            setMessages(prevMessages =>
                prevMessages.map((msg, idx) =>
                    idx === messageIndex ? { ...msg, content: updatedAiContent } : msg
                )
            );
        } catch (error) {
            console.error("Failed to load details:", error);
        } finally {
            setDetailLoadingIndex(null);
        }
    };

    return (
        <div className="h-full w-full flex flex-col">
            <div ref={chatHistoryRef} className="flex-1 p-6 space-y-6 overflow-y-auto custom-scrollbar">
                {messages.map((msg, index) => (
                    <ChatMessageComponent
                        key={index}
                        message={msg}
                        messageIndex={index}
                        onPlayAudio={handlePlayAudio}
                        onRequestDetails={handleRequestDetails}
                        isSpeaking={isSpeaking && index === messages.length - 1}
                        isDetailLoading={detailLoadingIndex === index}
                        isLatestAiMessage={index === messages.length - 1}
                    />
                ))}
                {isLoading && (
                    <div className="flex items-start gap-4">
                        <BotIcon className="w-8 h-8 flex-shrink-0 text-sky-400 mt-1 animate-pulse" />
                        <div className="max-w-2xl px-5 py-4 rounded-2xl bg-slate-700">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-sky-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-sky-400 rounded-full animate-bounce delay-150"></div>
                                <div className="w-2 h-2 bg-sky-400 rounded-full animate-bounce delay-300"></div>
                            </div>
                        </div>
                    </div>
                )}
                {messages.length === 0 && !isLoading && (
                    <div className="flex h-full items-center justify-center text-center text-slate-500">
                        <div>
                            <BotIcon className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                            <h2 className="text-2xl font-semibold text-slate-400">Selamat Datang!</h2>
                            <p className="mt-2 max-w-sm">Mulai percakapan dengan mengetik pertanyaan Anda di bawah untuk menerjemahkan dan menganalisis teks Bahasa Arab.</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-6 bg-slate-900/50 backdrop-blur-sm flex-shrink-0">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-center gap-2 p-1 bg-slate-800 rounded-lg mb-4">
                        <button 
                            onClick={() => setChatMode('translate')}
                            className={`flex-1 py-2 rounded-md text-sm font-semibold transition-colors ${chatMode === 'translate' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
                        >
                            Mode Terjemah
                        </button>
                        <button 
                            onClick={() => setChatMode('ask')}
                            className={`flex-1 py-2 rounded-md text-sm font-semibold transition-colors ${chatMode === 'ask' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
                        >
                            Mode Tanya
                        </button>
                    </div>

                    <form onSubmit={handleSendMessage} className="flex items-center gap-4 bg-slate-800 rounded-xl p-2 pl-5">
                        <input
                            type="text"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            placeholder={chatMode === 'translate' ? 'Terjemahkan ke Bahasa Arab...' : 'Tanyakan apa saja...'}
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
            </div>
        </div>
    );
};

export default ChatPage;