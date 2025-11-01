
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
  arabic: ArabicWithTranslit;
  root?: ArabicWithTranslit;
  madhi?: ArabicWithTranslit;
  mudhari?: ArabicWithTranslit;
  amr?: ArabicWithTranslit;
  singular?: ArabicWithTranslit;
  plural?: ArabicWithTranslit;
}

export interface AiMessageData {
  translation: string;
  transliteration: string;
  briefExplanation: string;
  keywords: SavedKeyword[];
  detailedExplanation?: string; // Optional: To be loaded on demand
}

export interface ChatMessage {
  author: MessageAuthor;
  content: string | AiMessageData;
}