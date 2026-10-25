import { getFileStatus, GeminiError } from "@/lib/gemini";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name");
  if (!name) {
    return Response.json({ error: "name প্যারামিটার প্রয়োজন।" }, { status: 400 });
  }
  try {
    const file = await getFileStatus(name);
    return Response.json({ file });
  } catch (err) {
    const status = err instanceof GeminiError ? err.status : 500;
    const message = err instanceof Error ? err.message : "অজানা সমস্যা হয়েছে।";
    return Response.json({ error: message }, { status });
  }
}
