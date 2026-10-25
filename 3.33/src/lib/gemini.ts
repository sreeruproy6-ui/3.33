// Server-side only helper for talking to the Google Gemini API.
// Never import this file from a client component.

const API_BASE = "https://generativelanguage.googleapis.com";

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY is not configured on the server.");
  }
  return key;
}

export const PRIMARY_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-pro";
export const FALLBACK_MODEL =
  process.env.GEMINI_FALLBACK_MODEL || "gemini-2.5-flash";

export class GeminiError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

/**
 * Starts a resumable upload session with the Gemini Files API.
 * Returns the upload URL that the BROWSER should PUT the raw file bytes to
 * directly (this keeps large files from ever passing through our server,
 * which is required to stay under hosting platforms' request body limits).
 */
export async function startResumableUpload(params: {
  displayName: string;
  mimeType: string;
  numBytes: number;
}): Promise<string> {
  const { displayName, mimeType, numBytes } = params;

  const res = await fetch(`${API_BASE}/upload/v1beta/files`, {
    method: "POST",
    headers: {
      "x-goog-api-key": getApiKey(),
      "X-Goog-Upload-Protocol": "resumable",
      "X-Goog-Upload-Command": "start",
      "X-Goog-Upload-Header-Content-Length": String(numBytes),
      "X-Goog-Upload-Header-Content-Type": mimeType,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ file: { display_name: displayName } }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new GeminiError(
      `Gemini ফাইল আপলোড সেশন শুরু করা যায়নি: ${res.status} ${body}`,
      res.status
    );
  }

  const uploadUrl = res.headers.get("x-goog-upload-url");
  if (!uploadUrl) {
    throw new GeminiError("Gemini থেকে কোনো আপলোড URL পাওয়া যায়নি।");
  }
  return uploadUrl;
}

export interface GeminiFileResource {
  name: string;
  uri: string;
  mimeType: string;
  state: "STATE_UNSPECIFIED" | "PROCESSING" | "ACTIVE" | "FAILED" | string;
  sizeBytes?: string;
  error?: { message?: string };
}

export async function getFileStatus(
  fileName: string
): Promise<GeminiFileResource> {
  const name = fileName.startsWith("files/") ? fileName : `files/${fileName}`;
  const res = await fetch(`${API_BASE}/v1beta/${name}`, {
    headers: { "x-goog-api-key": getApiKey() },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new GeminiError(
      `ফাইলের অবস্থা জানা যায়নি: ${res.status} ${body}`,
      res.status
    );
  }
  return res.json();
}

export async function deleteGeminiFile(fileName: string): Promise<void> {
  const name = fileName.startsWith("files/") ? fileName : `files/${fileName}`;
  await fetch(`${API_BASE}/v1beta/${name}`, {
    method: "DELETE",
    headers: { "x-goog-api-key": getApiKey() },
  }).catch(() => undefined);
}

const SEGMENT_SCHEMA = {
  type: "OBJECT",
  properties: {
    index: { type: "INTEGER" },
    startTime: {
      type: "STRING",
      description: "Timecode in HH:MM:SS format marking segment start.",
    },
    endTime: {
      type: "STRING",
      description: "Timecode in HH:MM:SS format marking segment end.",
    },
    speaker: {
      type: "STRING",
      description: "Speaker label if identifiable, otherwise empty string.",
    },
    originalText: {
      type: "STRING",
      description: "Verbatim transcript of this segment in the source/original language.",
    },
    translatedText: {
      type: "STRING",
      description: "The dubbing script line for this segment in the target language.",
    },
    toneNote: {
      type: "STRING",
      description:
        "Short acting/delivery direction for the voice artist in the target language (e.g. emotion, pace, emphasis).",
    },
  },
  required: ["startTime", "endTime", "originalText", "translatedText"],
};

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    detectedSourceLanguage: { type: "STRING" },
    titleGuess: { type: "STRING" },
    contentSummary: {
      type: "STRING",
      description:
        "A short synopsis, in the target language, of what happens in the media.",
    },
    overallToneGuide: {
      type: "STRING",
      description:
        "Overall direction for voice artists explaining how the whole piece should be delivered, in the target language.",
    },
    segments: {
      type: "ARRAY",
      items: SEGMENT_SCHEMA,
    },
  },
  required: ["segments"],
};

export interface DubbingSegment {
  index?: number;
  startTime: string;
  endTime: string;
  speaker?: string;
  originalText: string;
  translatedText: string;
  toneNote?: string;
}

export interface DubbingScriptResult {
  detectedSourceLanguage?: string;
  titleGuess?: string;
  contentSummary?: string;
  overallToneGuide?: string;
  segments: DubbingSegment[];
}

const TONE_GUIDE: Record<string, string> = {
  natural:
    "স্বাভাবিক ও কথোপকথনমূলক টোন — বাস্তব জীবনের মতো সহজ, স্বতঃস্ফূর্ত সংলাপ।",
  emotional:
    "আবেগঘন ও নাটকীয় টোন — চরিত্রের অনুভূতি (দুঃখ, রাগ, ভালোবাসা, উত্তেজনা) স্পষ্টভাবে ফুটিয়ে তুলতে হবে।",
  comedic:
    "হাস্যরসাত্মক ও প্রাণবন্ত টোন — মজার টাইমিং এবং হালকা চালে সংলাপ লিখতে হবে।",
  documentary:
    "গম্ভীর, তথ্যভিত্তিক ও বিশ্বাসযোগ্য টোন — ডকুমেন্টারি উপস্থাপনার মতো স্পষ্ট ও নিরপেক্ষ ভাষা।",
  promotional:
    "উদ্দীপনাপূর্ণ ও প্রাণবন্ত বিজ্ঞাপনী টোন — শ্রোতাকে আকৃষ্ট করার মতো জোরালো ও আত্মবিশ্বাসী সংলাপ।",
};

const CATEGORY_GUIDE: Record<string, string> = {
  tv_drama: "টিভি শো / নাটক সিরিয়াল — চরিত্রভিত্তিক স্বাভাবিক কথোপকথন বজায় রাখতে হবে।",
  animation:
    "অ্যানিমেশন / কার্টুন — অতিরঞ্জিত অভিব্যক্তি, বয়স-উপযোগী ভাষা এবং উৎফুল্ল সংলাপ রাখতে হবে।",
  movie: "মুভি / সিনেমা — সিনেমাটিক ও বাস্তবসম্মত সংলাপ, লিপ-সিঙ্ক বান্ধব দৈর্ঘ্য বজায় রাখতে হবে।",
  documentary: "ডকুমেন্টারি — তথ্যবহুল, নিরপেক্ষ ও স্পষ্ট ভাষা ব্যবহার করতে হবে।",
  ad_promo: "বিজ্ঞাপন / প্রোমো / ইউটিউব ভিডিও — সংক্ষিপ্ত, আকর্ষণীয় ও impactful সংলাপ লিখতে হবে।",
};

export function buildPrompt(opts: {
  sourceLanguage: string;
  targetLanguage: string;
  tone: string;
  category: string;
  instructions?: string;
}): string {
  const toneText = TONE_GUIDE[opts.tone] || opts.tone;
  const categoryText = CATEGORY_GUIDE[opts.category] || opts.category;
  const isBangla = /bangla|bengali|বাংলা/i.test(opts.targetLanguage);

  return `তুমি "Roy — The Script Writer", একজন অত্যন্ত দক্ষ পেশাদার ডাবিং স্ক্রিপ্ট রাইটার ও অনুবাদক, বাংলা ভাষায় বিশেষজ্ঞ।

কাজ: সংযুক্ত অডিও/ভিডিও ফাইলটি মনোযোগ দিয়ে শোনো এবং সম্পূর্ণ একটি টাইমকোডযুক্ত ডাবিং স্ক্রিপ্ট তৈরি করো, যা একজন ভয়েস আর্টিস্ট সরাসরি দেখে দেখে ডাবিং করতে পারবে।

নির্দেশনা (অত্যন্ত গুরুত্বপূর্ণ, কঠোরভাবে মেনে চলো):
1. মূল অডিওর ভাষা শনাক্ত করো। ব্যবহারকারীর দেওয়া তথ্য অনুযায়ী মূল ভাষা: "${opts.sourceLanguage}"।
2. প্রতিটি সংলাপ/বাক্যাংশকে স্বাভাবিক বিরতি অনুযায়ী ছোট ছোট সেগমেন্টে ভাগ করো (সাধারণত ২-৮ সেকেন্ড), এবং প্রতিটি সেগমেন্টের শুরু ও শেষ সময় HH:MM:SS ফরম্যাটে নির্ভুলভাবে দাও। পুরো অডিও/ভিডিওর শুরু থেকে শেষ পর্যন্ত কোনো অংশ বাদ দেওয়া যাবে না।
3. প্রতিটি সেগমেন্টে originalText (মূল ভাষায় যা বলা হয়েছে, হুবহু) এবং translatedText (টার্গেট ভাষা "${opts.targetLanguage}"-এ ডাবিং-উপযোগী সংলাপ) দুটোই দাও।
4. টার্গেট ভাষা "${opts.targetLanguage}"-এ অনুবাদ/স্ক্রিপ্ট লেখার সময়:
   ${
     isBangla
       ? "- এটি অবশ্যই সম্পূর্ণ শুদ্ধ, প্রাঞ্জল ও প্রমিত বাংলায় (বানান ভুল ছাড়া) হতে হবে।\n   - আক্ষরিক অনুবাদ না করে, বাংলা ভাষাভাষীদের কাছে স্বাভাবিক শোনায় এমনভাবে ডাবিং স্ক্রিপ্ট লেখো (ইডিয়ম, সংস্কৃতি অভিযোজন সহ)।\n   - মূল অডিওর মুখের নড়াচড়া/সময়ের সাথে মানানসই রাখতে বাক্যের দৈর্ঘ্য নিয়ন্ত্রণ করো (lip-sync friendly)।\n   - চরিত্রের সম্পর্ক বুঝে যথাযথ সম্বোধন ব্যবহার করো (আপনি/তুমি/তুই)।"
       : "- Produce a natural, fluent, dubbing-ready script in the requested target language, adapted (not just literally translated) so it sounds natural to native speakers and fits lip-sync timing."
   }
5. প্রতিটি সেগমেন্টে একটি সংক্ষিপ্ত toneNote (ডেলিভারি নির্দেশনা) দাও — যেমন কণ্ঠস্বরের আবেগ, গতি, জোর ইত্যাদি, যা নিচের overall টোন অনুসরণ করবে।
6. সামগ্রিক টোন: ${toneText}
7. কন্টেন্ট ক্যাটাগরি: ${categoryText}
8. speaker চিহ্নিত করা গেলে (যেমন "নারী ১", "পুরুষ ২", "বর্ণনাকারী") তা লেখো, না পারলে খালি রাখো।
9. contentSummary এ পুরো কন্টেন্টের সংক্ষিপ্ত সারাংশ (টার্গেট ভাষায়) দাও।
10. overallToneGuide এ পুরো কাজের জন্য একটি সংক্ষিপ্ত নির্দেশনা দাও (টার্গেট ভাষায়), যাতে ভয়েস আর্টিস্ট পুরো প্রজেক্টের মেজাজ বুঝতে পারে।
${opts.instructions ? `11. ব্যবহারকারীর অতিরিক্ত নির্দেশনা (এটি অবশ্যই মেনে চলো): ${opts.instructions}` : ""}

শুধুমাত্র নির্ধারিত JSON স্কিমা অনুযায়ী আউটপুট দাও, অন্য কোনো টেক্সট/ব্যাখ্যা দিও না।`;
}

export async function generateDubbingScript(opts: {
  fileUri: string;
  mimeType: string;
  sourceLanguage: string;
  targetLanguage: string;
  tone: string;
  category: string;
  instructions?: string;
}): Promise<{ result: DubbingScriptResult; modelUsed: string }> {
  const prompt = buildPrompt(opts);

  const body = {
    contents: [
      {
        role: "user",
        parts: [
          { file_data: { mime_type: opts.mimeType, file_uri: opts.fileUri } },
          { text: prompt },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.4,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    },
  };

  const models = [PRIMARY_MODEL, FALLBACK_MODEL].filter(
    (m, i, arr) => arr.indexOf(m) === i
  );

  let lastError: unknown = null;

  for (const model of models) {
    try {
      const res = await fetch(
        `${API_BASE}/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: {
            "x-goog-api-key": getApiKey(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        lastError = new GeminiError(
          `Gemini (${model}) থেকে স্ক্রিপ্ট তৈরি করা যায়নি: ${res.status} ${errText}`,
          res.status
        );
        // Retry with fallback model on quota/server errors only.
        if (res.status === 429 || res.status >= 500) continue;
        throw lastError;
      }

      const json = await res.json();
      const text: string | undefined =
        json?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        const finishReason = json?.candidates?.[0]?.finishReason;
        lastError = new GeminiError(
          `Gemini থেকে কোনো স্ক্রিপ্ট পাওয়া যায়নি (${finishReason || "unknown"})।`
        );
        continue;
      }

      const parsed = JSON.parse(text) as DubbingScriptResult;
      if (!parsed.segments || !Array.isArray(parsed.segments)) {
        lastError = new GeminiError("Gemini থেকে সঠিক ফরম্যাটে স্ক্রিপ্ট পাওয়া যায়নি।");
        continue;
      }
      parsed.segments = parsed.segments.map((s, i) => ({
        ...s,
        index: s.index ?? i + 1,
      }));

      return { result: parsed, modelUsed: model };
    } catch (err) {
      lastError = err;
    }
  }

  if (lastError instanceof GeminiError) throw lastError;
  throw new GeminiError(
    lastError instanceof Error ? lastError.message : "অজানা ত্রুটি হয়েছে।"
  );
}
