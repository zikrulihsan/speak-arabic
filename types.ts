
export enum MessageAuthor {
  USER = 'user',
  AI = 'ai',
}

export type ChatMode = 'translate' | 'ask';

export interface ArabicWithTranslit {
  arabic: string;
  translit: string;
}

// Simplified keyword structure - only stores minimal data
export interface SavedKeyword {
  indonesian: string;
  arabic: string;
  translit: string;
}

// Full keyword structure with detailed analysis (for runtime use only, not stored)
export interface DetailedKeyword {
  indonesian: string;
  translation: ArabicWithTranslit;
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
  keywords?: DetailedKeyword[];
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