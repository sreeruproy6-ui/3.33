import { desc } from "drizzle-orm";
import { db } from "@/db";
import { dubbingJobs } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db
    .select({
      id: dubbingJobs.id,
      title: dubbingJobs.title,
      mimeType: dubbingJobs.mimeType,
      fileSizeBytes: dubbingJobs.fileSizeBytes,
      sourceLanguage: dubbingJobs.sourceLanguage,
      targetLanguage: dubbingJobs.targetLanguage,
      tone: dubbingJobs.tone,
      category: dubbingJobs.category,
      status: dubbingJobs.status,
      errorMessage: dubbingJobs.errorMessage,
      createdAt: dubbingJobs.createdAt,
      updatedAt: dubbingJobs.updatedAt,
    })
    .from(dubbingJobs)
    .orderBy(desc(dubbingJobs.createdAt))
    .limit(50);

  return Response.json({ jobs: rows });
}
