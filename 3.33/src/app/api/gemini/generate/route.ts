import { eq } from "drizzle-orm";
import { db } from "@/db";
import { dubbingJobs } from "@/db/schema";
import { generateDubbingScript, GeminiError } from "@/lib/gemini";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { jobId } = await req.json();
    if (!jobId) {
      return Response.json({ error: "jobId প্রয়োজন।" }, { status: 400 });
    }

    const rows = await db
      .select()
      .from(dubbingJobs)
      .where(eq(dubbingJobs.id, jobId))
      .limit(1);
    const job = rows[0];
    if (!job) {
      return Response.json({ error: "এই জব খুঁজে পাওয়া যায়নি।" }, { status: 404 });
    }
    if (!job.geminiFileUri || !job.geminiFileName) {
      return Response.json(
        { error: "ফাইল এখনো আপলোড সম্পন্ন হয়নি।" },
        { status: 400 }
      );
    }

    await db
      .update(dubbingJobs)
      .set({ status: "generating", updatedAt: new Date() })
      .where(eq(dubbingJobs.id, jobId));

    try {
      const { result, modelUsed } = await generateDubbingScript({
        fileUri: job.geminiFileUri,
        mimeType: job.mimeType,
        sourceLanguage: job.sourceLanguage,
        targetLanguage: job.targetLanguage,
        tone: job.tone,
        category: job.category,
        instructions: job.instructions || undefined,
      });

      await db
        .update(dubbingJobs)
        .set({
          status: "completed",
          resultJson: result,
          errorMessage: null,
          updatedAt: new Date(),
        })
        .where(eq(dubbingJobs.id, jobId));

      return Response.json({ result, modelUsed });
    } catch (genErr) {
      const message =
        genErr instanceof Error ? genErr.message : "স্ক্রিপ্ট তৈরি ব্যর্থ হয়েছে।";
      await db
        .update(dubbingJobs)
        .set({ status: "error", errorMessage: message, updatedAt: new Date() })
        .where(eq(dubbingJobs.id, jobId));
      throw genErr;
    }
  } catch (err) {
    const status = err instanceof GeminiError ? err.status : 500;
    const message = err instanceof Error ? err.message : "অজানা সমস্যা হয়েছে।";
    return Response.json({ error: message }, { status });
  }
}
