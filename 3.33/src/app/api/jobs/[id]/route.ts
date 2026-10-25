import { eq } from "drizzle-orm";
import { db } from "@/db";
import { dubbingJobs } from "@/db/schema";
import { deleteGeminiFile } from "@/lib/gemini";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const rows = await db
    .select()
    .from(dubbingJobs)
    .where(eq(dubbingJobs.id, id))
    .limit(1);
  const job = rows[0];
  if (!job) {
    return Response.json({ error: "জব খুঁজে পাওয়া যায়নি।" }, { status: 404 });
  }
  return Response.json({ job });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json();

  const update: Record<string, unknown> = { updatedAt: new Date() };
  if (typeof body.status === "string") update.status = body.status;
  if (typeof body.geminiFileUri === "string")
    update.geminiFileUri = body.geminiFileUri;
  if (typeof body.geminiFileName === "string")
    update.geminiFileName = body.geminiFileName;
  if (body.resultJson !== undefined) update.resultJson = body.resultJson;
  if (typeof body.errorMessage === "string" || body.errorMessage === null)
    update.errorMessage = body.errorMessage;
  if (typeof body.title === "string") update.title = body.title;

  const rows = await db
    .update(dubbingJobs)
    .set(update)
    .where(eq(dubbingJobs.id, id))
    .returning();

  const job = rows[0];
  if (!job) {
    return Response.json({ error: "জব খুঁজে পাওয়া যায়নি।" }, { status: 404 });
  }
  return Response.json({ job });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const rows = await db
    .delete(dubbingJobs)
    .where(eq(dubbingJobs.id, id))
    .returning();
  const job = rows[0];
  if (job?.geminiFileName) {
    await deleteGeminiFile(job.geminiFileName);
  }
  return Response.json({ ok: true });
}
