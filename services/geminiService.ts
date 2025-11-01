import { GoogleGenAI, Chat, Type, Modality, GenerateContentResponse } from "@google/genai";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const chatModel = 'gemini-2.5-flash';
const ttsModel = 'gemini-2.5-flash-preview-tts';

const arabicWithTranslitSchema = {
    type: Type.OBJECT,
    properties: {
        arabic: { type: Type.STRING, description: 'Teks Arab lengkap dengan harakat.' },
        translit: { type: Type.STRING, description: 'Transliterasi fonetik dari teks Arab.' },
    },
    required: ['arabic', 'translit'],
};

const chatSystemInstruction = `Anda adalah penerjemah ahli Bahasa Indonesia ke Bahasa Arab dan seorang ahli Nahwu/Sharaf.
Tugas Anda adalah:
1.  TERJEMAHKAN secepatnya teks dari Bahasa Indonesia ke Bahasa Arab. Pastikan tulisan Arab SELALU memiliki harakat.
2.  Berikan TRANSLITERASI (teks latin) untuk hasil terjemahan Arab.
3.  Berikan PENJELASAN SINGKAT (satu atau dua kalimat) tentang struktur kalimat atau kata kunci utama.
4.  Identifikasi 3 kata kunci (keywords). Untuk setiap kata kunci:
    a. Berikan padanan kata dalam Bahasa Indonesia.
    b. Untuk setiap padanan kata Arab, berikan teks Arab DENGAN HARAKAT dan transliterasinya.
    c. JIKA kata kunci adalah kata kerja (fi'l), identifikasi akar katanya dan berikan bentuk fi'l Madhi, Mudhari', dan Amr-nya (masing-masing dengan teks Arab berharakat dan transliterasi). Kosongkan field isim.
    d. JIKA kata kunci adalah kata benda (isim), identifikasi bentuk tunggal (mufrad) dan jamak (jamak taksir/salim)-nya (masing-masing dengan teks Arab berharakat dan transliterasi). Kosongkan field kata kerja.
    e. JIKA bukan keduanya, kosongkan field kata kerja dan isim.
5.  JAWAB HANYA DALAM FORMAT JSON yang valid sesuai skema. JANGAN tambahkan teks lain. Prioritaskan kecepatan.`;

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    translation: {
      type: Type.STRING,
      description: 'Hasil terjemahan teks ke dalam Bahasa Arab dengan harakat.',
    },
    transliteration: {
        type: Type.STRING,
        description: 'Transliterasi fonetik dari teks Arab ke aksara Latin.',
    },
    briefExplanation: {
      type: Type.STRING,
      description: 'Penjelasan SANGAT SINGKAT (satu atau dua kalimat) tentang kaidah bahasa.',
    },
    keywords: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          indonesian: {
            type: Type.STRING,
            description: 'Kata kunci dalam Bahasa Indonesia.',
          },
          arabic: arabicWithTranslitSchema,
          root: arabicWithTranslitSchema,
          madhi: arabicWithTranslitSchema,
          mudhari: arabicWithTranslitSchema,
          amr: arabicWithTranslitSchema,
          singular: arabicWithTranslitSchema,
          plural: arabicWithTranslitSchema,
        },
        required: ['indonesian', 'arabic'],
      },
    },
  },
  required: ['translation', 'transliteration', 'briefExplanation', 'keywords'],
};


export function startChatSession(): Chat {
  return ai.chats.create({
    model: chatModel,
    config: {
      systemInstruction: chatSystemInstruction,
      responseMimeType: "application/json",
      responseSchema: responseSchema,
    },
  });
}

const generalChatSystemInstruction = `Anda adalah asisten ahli yang berspesialisasi dalam bahasa Arab, Nahwu, dan Sharaf. Jawab pertanyaan pengguna secara informatif dan jelas. Gunakan format Markdown jika diperlukan untuk menyajikan informasi dengan baik (misalnya, daftar, teks tebal). Anda melanjutkan percakapan yang mungkin dimulai dengan terjemahan. Konteks dari pesan sebelumnya sangat penting.`;

export function startGeneralChatSession(): Chat {
  return ai.chats.create({
    model: chatModel,
    config: {
      systemInstruction: generalChatSystemInstruction,
    },
  });
}


export async function getDetailedExplanation(originalText: string, translation: string): Promise<string> {
  const prompt = `Analisis setiap kata dalam kalimat Arab berikut: "${translation}" (terjemahan dari: "${originalText}").
Untuk setiap kata, berikan poin-poin berikut dalam format Markdown:
- **Terjemah**: Arti kata dalam Bahasa Indonesia.
- **Jenis Kata**: Penjelasan singkat (Ism, Fi'l, Harf, dll).
- **Kaidah**: Penjelasan Nahwu/Sharaf yang SANGAT RINGKAS dan relevan.

Buat penjelasan to the point, mirip contoh ini untuk kata 'الآن':
- **Terjemah**: Sekarang.
- **Jenis Kata**: Ism Zarf Zaman (keterangan waktu).
- **Kaidah**: Mabni (tidak berubah harakat akhir).

Hanya analisis kata-kata dalam kalimat. JANGAN berikan ringkasan atau pendahuluan.`;
  
  try {
    const response = await ai.models.generateContent({
      model: chatModel,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error getting detailed explanation:", error);
    return "Maaf, terjadi kesalahan saat mengambil penjelasan detail.";
  }
}

export async function generateSpeech(text: string): Promise<string | undefined> {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: ttsModel,
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' }, // A voice suitable for Arabic
            },
        },
      },
    });
    
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio;
  } catch (error) {
    console.error("Error generating speech:", error);
    return undefined;
  }
}