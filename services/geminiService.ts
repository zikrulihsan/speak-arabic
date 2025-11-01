import { GoogleGenAI, Chat, GenerateContentResponse, Modality, Type, LiveSession } from "@google/genai";
import { getCachedAudio, setCachedAudio } from './audioCache';

let ai: GoogleGenAI;
let currentApiKey: string | null = process.env.API_KEY || null;

export function initializeAI(apiKey?: string) {
  if (apiKey) {
    currentApiKey = apiKey;
  }

  if (!currentApiKey) {
    throw new Error("API_KEY is not set. Please provide a Gemini API key.");
  }

  ai = new GoogleGenAI({ apiKey: currentApiKey });
}

export function isAIInitialized(): boolean {
  return currentApiKey !== null;
}

export function getStoredApiKey(): string | null {
  return currentApiKey;
}

// Initialize AI with environment variable if available
if (currentApiKey) {
  initializeAI();
}

const chatModel = 'gemini-2.5-flash';
const ttsModel = 'gemini-2.5-flash-preview-tts';

const arabicWithTranslitSchema = {
  type: Type.OBJECT,
  properties: {
    arabic: { type: Type.STRING, description: 'Teks dalam bahasa Arab dengan harakat lengkap.' },
    translit: { type: Type.STRING, description: 'Transliterasi fonetik dari teks Arab.' },
  },
  required: ['arabic', 'translit'],
};

// --- Skema untuk Terjemahan Cepat ---
const fastTranslationSchema = {
  type: Type.OBJECT,
  properties: {
    arabic: { type: Type.STRING, description: 'Terjemahan lengkap kalimat ke dalam bahasa Arab dengan harakat.' },
    translit: { type: Type.STRING, description: 'Transliterasi fonetik dari kalimat Arab lengkap.' },
    explanation: {
      type: Type.ARRAY,
      description: 'Penjelasan kata per kata dari kalimat.',
      items: {
        type: Type.OBJECT,
        properties: {
          arabic: { type: Type.STRING },
          translit: { type: Type.STRING },
          indonesian: { type: Type.STRING },
        },
        required: ['arabic', 'translit', 'indonesian'],
      },
    },
  },
  required: ['arabic', 'translit', 'explanation'],
};

const fastTranslationSystemInstruction = `Anda adalah penerjemah ahli Bahasa Indonesia ke Bahasa Arab. Tugas Anda adalah menerjemahkan kalimat dan memberikan penjelasan per kata. Anda HARUS mengembalikan respons dalam format JSON yang terstruktur. Jangan sertakan analisis kata kunci yang mendalam, fokus hanya pada terjemahan dan penjelasan langsung.`;

export function startFastTranslationSession(history?: any[]): Chat {
  if (!ai) {
    throw new Error("AI not initialized. Please provide an API key.");
  }
  return ai.chats.create({
    model: chatModel,
    history: history?.map(msg => ({
      role: msg.role,
      parts: [{ text: typeof msg.parts[0].text === 'string' ? msg.parts[0].text : JSON.stringify(msg.parts[0].text) }]
    })),
    config: {
      systemInstruction: fastTranslationSystemInstruction,
      responseMimeType: 'application/json',
      responseSchema: fastTranslationSchema,
    },
  });
}

// --- Skema untuk Ekstraksi Kata Kunci ---
const keywordExtractionSchema = {
  type: Type.OBJECT,
  properties: {
     keywords: {
      type: Type.ARRAY,
      description: 'Daftar kata kunci penting dari kalimat, termasuk analisis sharafnya.',
      items: {
        type: Type.OBJECT,
        properties: {
          indonesian: { type: Type.STRING },
          translation: arabicWithTranslitSchema,
          type: { type: Type.STRING, enum: ["fi'il", 'isim', 'lainnya'] },
          root: { ...arabicWithTranslitSchema, description: 'Akar kata (hanya untuk fi\'il).' },
          verbForms: {
            type: Type.OBJECT,
            description: 'Bentuk kata kerja (hanya untuk fi\'il).',
            properties: {
              madhi: arabicWithTranslitSchema,
              mudhari: arabicWithTranslitSchema,
              amr: arabicWithTranslitSchema,
            },
          },
          nounForms: {
            type: Type.OBJECT,
            description: 'Bentuk kata benda (hanya untuk isim).',
            properties: {
              singular: arabicWithTranslitSchema,
              plural: arabicWithTranslitSchema,
            },
          },
        },
        required: ['indonesian', 'translation', 'type'],
      },
    },
  },
  required: ['keywords'],
}

const keywordExtractionSystemInstruction = `Anda adalah ahli tata bahasa Arab (Nahwu & Sharaf). Dari kalimat Bahasa Indonesia yang diberikan, ekstrak kata-kata kunci yang penting. Anda HARUS memberikan analisis mendalam untuk setiap kata.
   - Tentukan \`indonesian\`, \`translation\` (objek \`{arabic, translit}\`), dan \`type\` ('fi'il', 'isim', atau 'lainnya').
   - **WAJIB:** Jika \`type\` adalah 'fi'il', Anda HARUS menyertakan \`root\` dan \`verbForms\` (\`{madhi, mudhari, amr}\`). JANGAN biarkan properti ini kosong.
   - **WAJIB:** Jika \`type\` adalah 'isim', Anda HARUS menyertakan \`nounForms\` (\`{singular, plural}\`). JANGAN biarkan properti ini kosong.
   - Pastikan setiap bentuk kata Arab dalam keyword (translation, root, madhi, dll.) adalah objek yang berisi \`arabic\` (dengan harakat) dan \`translit\`.
Anda HARUS mengembalikan respons dalam format JSON yang HANYA berisi objek \`keywords\`.`;

export async function extractKeywords(text: string) {
    try {
        if (!ai) {
            throw new Error("AI not initialized. Please provide an API key.");
        }
        const response = await ai.models.generateContent({
            model: chatModel,
            contents: [{ parts: [{ text }] }],
            config: {
                systemInstruction: keywordExtractionSystemInstruction,
                responseMimeType: 'application/json',
                responseSchema: keywordExtractionSchema,
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText).keywords || [];
    } catch(error) {
        console.error("Error extracting keywords:", error);
        return [];
    }
}


// --- Sesi Chat Umum ---
const generalChatSystemInstruction = `Anda adalah asisten ahli yang berspesialisasi dalam bahasa Arab, Nahwu, dan Sharaf. Jawab pertanyaan pengguna secara informatif dan jelas. Gunakan format Markdown jika diperlukan untuk menyajikan informasi dengan baik (misalnya, daftar, teks tebal). Anda melanjutkan percakapan yang mungkin dimulai dengan terjemahan. Konteks dari pesan sebelumnya sangat penting.`;

export function startGeneralChatSession(history?: any[]): Chat {
  if (!ai) {
    throw new Error("AI not initialized. Please provide an API key.");
  }
  return ai.chats.create({
    model: chatModel,
    history: history?.map(msg => ({
      role: msg.role,
      parts: [{ text: typeof msg.parts[0].text === 'string' ? msg.parts[0].text : JSON.stringify(msg.parts[0].text) }]
    })),
    config: {
      systemInstruction: generalChatSystemInstruction,
    },
  });
}

// --- Layanan TTS ---
export async function generateSpeech(text: string): Promise<string | null> {
    try {
        // Check cache first
        const cachedAudio = getCachedAudio(text);
        if (cachedAudio) {
            return cachedAudio;
        }

        if (!ai) {
            throw new Error("AI not initialized. Please provide an API key.");
        }

        // Generate new audio via API
        const response = await ai.models.generateContent({
            model: ttsModel,
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

        // Cache the generated audio
        if (base64Audio) {
            setCachedAudio(text, base64Audio);
        }

        return base64Audio || null;
    } catch (error) {
        console.error("Error generating speech:", error);
        return null;
    }
}

// --- Penjelasan Konsep Tata Bahasa ---
export async function explainGrammarConcept(concept: string, word: { arabic: string; translit: string }): Promise<string> {
    const prompt = `Jelaskan secara SANGAT SINGKAT (1-2 kalimat) perubahan tata bahasa pada kata "${word.arabic} (${word.translit})" dalam konteks "${concept}". Contoh: Jika kata adalah 'أَكَلْتُ', jelaskan mengapa diakhiri dengan 'تُ' (artinya 'saya'). Jika kata adalah 'زَوْجَتِي', jelaskan mengapa diakhiri dengan 'ي' (artinya 'milikku'). Langsung ke intinya tanpa pengenalan umum. Gunakan format Markdown.`;

    try {
        if (!ai) {
            throw new Error("AI not initialized. Please provide an API key.");
        }
        const response = await ai.models.generateContent({
            model: chatModel,
            contents: [{ parts: [{ text: prompt }] }],
        });
        return response.text;
    } catch (error) {
        console.error("Error explaining grammar concept:", error);
        return "Maaf, terjadi kesalahan saat mencoba mendapatkan penjelasan.";
    }
}

// --- Penjelasan Detail Kata Kunci ---
export async function explainKeywordDetail(indonesian: string, arabic: string, translit: string): Promise<string> {
    const prompt = `Jelaskan kata Arab "${arabic}" (${translit}) yang artinya "${indonesian}" dalam Bahasa Indonesia.

Berikan penjelasan yang mencakup:
1. Jenis kata (kata benda/isim, kata kerja/fi'il, atau lainnya)
2. Jika kata benda:
   - Bentuk tunggal dan jamak (plural) dengan harakat lengkap dan transliterasi
   - Jenis jamak (jam' mudzakkar salim, jam' muannats salim, atau jam' taksir)
3. Jika kata kerja:
   - Bentuk Madhi (lampau), Mudhari' (kini/akan), dan Amr (perintah) dengan harakat dan transliterasi
   - Akar kata (fi'il tsulasi mujarrad)
4. Kategori Nahwu/Sharaf yang relevan

Format output dengan Markdown yang rapi. Gunakan format:
- **Arabic:** dengan harakat lengkap
- **Transliterasi:** dalam huruf latin
- **Indonesian:** terjemahan

Contoh output yang diharapkan:
"Kata النَّوَافِذِ (an-nawāfidhi) adalah bentuk jamak (plural) dari kata jendela.

Bentuk tunggalnya adalah:
- **Arabic:** نَافِذَةٌ
- **Transliterasi:** nāfidhah
- **Indonesian:** jendela

Jadi:
- نَافِذَةٌ (nāfidhah) = satu jendela
- النَّوَافِذِ (an-nawāfidhi) = jendela-jendela

Dalam Nahwu, النَّوَافِذِ termasuk dalam kategori jam' taksir (plural tidak beraturan) dari نَافِذَةٌ."`;

    try {
        if (!ai) {
            throw new Error("AI not initialized. Please provide an API key.");
        }
        const response = await ai.models.generateContent({
            model: chatModel,
            contents: [{ parts: [{ text: prompt }] }],
        });
        return response.text;
    } catch (error) {
        console.error("Error explaining keyword detail:", error);
        return "Maaf, terjadi kesalahan saat mencoba mendapatkan penjelasan.";
    }
}

// --- Live Voice Transcription ---
const liveAudioModel = 'gemini-2.5-flash-exp';

export async function connectLive(callbacks: {
    onopen?: () => void;
    onmessage?: (message: any) => void;
    onerror?: (error: any) => void;
    onclose?: (event: any) => void;
}): Promise<LiveSession> {
    if (!ai) {
        throw new Error("AI not initialized. Please provide an API key.");
    }

    // Create a live session for real-time audio transcription
    const liveSession = await ai.live.connect({
        model: liveAudioModel,
        callbacks: {
            onopen: () => {
                console.log('Live session connected');
                if (callbacks.onopen) callbacks.onopen();
            },
            onmessage: callbacks.onmessage,
            onerror: callbacks.onerror,
            onclose: callbacks.onclose,
        },
        config: {
            systemInstruction: 'You are a helpful assistant that transcribes Indonesian speech accurately.',
        },
    });

    return liveSession;
}