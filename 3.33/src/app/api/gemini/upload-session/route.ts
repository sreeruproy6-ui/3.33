import { randomUUID } from "crypto";
import { db } from "@/db";
import { dubbingJobs } from "@/db/schema";
import { startResumableUpload, GeminiError } from "@/lib/gemini";
import { MAX_FILE_SIZE_BYTES } from "@/lib/options";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      fileName,
      mimeType,
      numBytes,
      sourceLanguage,
      targetLanguage,
      tone,
      category,
      instructions,
    } = body || {};

    if (!fileName || !mimeType || typeof numBytes !== "number") {
      return Response.json(
        { error: "ফাইলের তথ্য অসম্পূর্ণ।" },
        { status: 400 }
      );
    }
    if (numBytes <= 0 || numBytes > MAX_FILE_SIZE_BYTES) {
      return Response.json(
        { error: "ফাইলের সর্বোচ্চ আকার ৩০০ এমবি।" },
        { status: 400 }
      );
    }
    if (!sourceLanguage || !targetLanguage || !tone || !category) {
      return Response.json(
        { error: "ভাষা, টোন ও ক্যাটাগরি নির্বাচন করুন।" },
        { status: 400 }
      );
    }

    const isAudio = mimeType.startsWith("audio/");
    const isVideo = mimeType.startsWith("video/");
    if (!isAudio && !isVideo) {
      return Response.json(
        { error: "শুধুমাত্র অডিও অথবা ভিডিও ফাইল আপলোড করা যাবে।" },
        { status: 400 }
      );
    }

    const jobId = randomUUID();

    const uploadUrl = await startResumableUpload({
      displayName: fileName,
      mimeType,
      numBytes,
    });

    await db.insert(dubbingJobs).values({
      id: jobId,
      title: fileName,
      mimeType,
      fileSizeBytes: numBytes,
      sourceLanguage,
      targetLanguage,
      tone,
      category,
      instructions: instructions || null,
      status: "uploading",
    });

    return Response.json({ jobId, uploadUrl });
  } catch (err) {
    const status = err instanceof GeminiError ? err.status : 500;
    const message = err instanceof Error ? err.message : "অজানা সমস্যা হয়েছে।";
    return Response.json({ error: message }, { status });
  }
}
