
export enum MessageAuthor {
  USER = 'user',
  AI = 'ai',
}

export type ChatMode = 'translate' | 'ask';

export interface ArabicWithTranslit {
  arabic: string;
  translit: string;
}

export interface SavedKeyword {
  indonesian: string;
  translation: ArabicWithTranslit;
  // Fix: Use an escaped single quote for "fi'il" to create a valid string literal type.
  type: 'fi\'il' | 'isim' | 'lainnya';
  root?: ArabicWithTranslit;
  verbForms?: {
    madhi: ArabicWithTranslit;
    mudhari: ArabicWithTranslit;
    amr: ArabicWithTranslit;
  };
  nounForms?: {
    singular: ArabicWithTranslit;
    plural: ArabicWithTranslit;
  };
}


export interface AiMessageData {
  arabic: string;
  translit: string;
  explanation: {
    arabic: string;
    translit: string;
    indonesian: string;
  }[];
  keywords?: SavedKeyword[];
  keywordsLoading?: boolean;
}


export interface ChatMessage {
  id: string;
  author: MessageAuthor;
  content: string | AiMessageData;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
}