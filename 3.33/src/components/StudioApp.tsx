"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LANGUAGES, TONES, CATEGORIES, MAX_FILE_SIZE_BYTES, labelFor } from "@/lib/options";
import { formatBytes, uploadFileDirect } from "@/lib/clientUpload";
import type { DubbingScriptResult, JobSummary } from "@/lib/types";
import HowItWorks from "./HowItWorks";
import HistoryPanel from "./HistoryPanel";
import ScriptEditor from "./ScriptEditor";

type Stage =
  | "idle"
  | "uploading"
  | "processing_file"
  | "generating"
  | "completed"
  | "error";

const STAGE_LABEL: Record<Stage, string> = {
  idle: "",
  uploading: "ফাইল আপলোড হচ্ছে...",
  processing_file: "Gemini ফাইলটি প্রসেস করছে...",
  generating: "Roy ডাবিং স্ক্রিপ্ট লিখছে...",
  completed: "সম্পন্ন হয়েছে!",
  error: "একটি সমস্যা হয়েছে",
};

export default function StudioApp() {
  const [file, setFile] = useState<File | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const [sourceLanguage, setSourceLanguage] = useState("Bangla");
  const [sourceOther, setSourceOther] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("Bangla");
  const [targetOther, setTargetOther] = useState("");
  const [tone, setTone] = useState("natural");
  const [category, setCategory] = useState("tv_drama");
  const [instructions, setInstructions] = useState("");

  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [result, setResult] = useState<DubbingScriptResult | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [activeMime, setActiveMime] = useState<string>("audio/mpeg");

  const resultRef = useRef<HTMLDivElement>(null);

  const loadJobs = useCallback(async () => {
    setJobsLoading(true);
    try {
      const res = await fetch("/api/jobs");
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch {
      // ignore
    } finally {
      setJobsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  useEffect(() => {
    return () => {
      if (mediaUrl) URL.revokeObjectURL(mediaUrl);
    };
  }, [mediaUrl]);

  const resolvedSource = sourceLanguage === "Other" ? sourceOther || "Other" : sourceLanguage;
  const resolvedTarget = targetLanguage === "Other" ? targetOther || "Other" : targetLanguage;

  function pickFile(f: File | null) {
    setErrorMessage(null);
    if (!f) return;
    const isAudio = f.type.startsWith("audio/");
    const isVideo = f.type.startsWith("video/");
    if (!isAudio && !isVideo) {
      setErrorMessage("শুধুমাত্র অডিও অথবা ভিডিও ফাইল আপলোড করা যাবে।");
      return;
    }
    if (f.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage("ফাইলের সর্বোচ্চ আকার ৩০০ এমবি। অনুগ্রহ করে ছোট ফাইল আপলোড করুন।");
      return;
    }
    if (mediaUrl) URL.revokeObjectURL(mediaUrl);
    setFile(f);
    setMediaUrl(URL.createObjectURL(f));
    setResult(null);
    setStage("idle");
    setProgress(0);
  }

  async function pollFileUntilActive(fileName: string, maxAttempts = 90): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      const res = await fetch(`/api/gemini/file-status?name=${encodeURIComponent(fileName)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ফাইল স্ট্যাটাস জানা যায়নি।");
      const state = data.file?.state;
      if (state === "ACTIVE") return;
      if (state === "FAILED") throw new Error("Gemini ফাইল প্রসেস করতে ব্যর্থ হয়েছে।");
      await new Promise((r) => setTimeout(r, 3000));
    }
    throw new Error("ফাইল প্রসেস হতে অনেক সময় লাগছে, একটু পরে আবার চেষ্টা করুন।");
  }

  async function handleGenerate() {
    if (!file) {
      setErrorMessage("প্রথমে একটি অডিও বা ভিডিও ফাইল আপলোড করুন।");
      return;
    }
    if (sourceLanguage === "Other" && !sourceOther.trim()) {
      setErrorMessage("মূল অডিওর ভাষার নাম লিখুন।");
      return;
    }
    if (targetLanguage === "Other" && !targetOther.trim()) {
      setErrorMessage("স্ক্রিপ্টের ভাষার নাম লিখুন।");
      return;
    }

    setErrorMessage(null);
    setResult(null);
    setDirty(false);
    setActiveMime(file.type);

    try {
      setStage("uploading");
      setProgress(0);

      const sessionRes = await fetch("/api/gemini/upload-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          numBytes: file.size,
          sourceLanguage: resolvedSource,
          targetLanguage: resolvedTarget,
          tone,
          category,
          instructions: instructions.trim() || undefined,
        }),
      });
      const sessionData = await sessionRes.json();
      if (!sessionRes.ok) throw new Error(sessionData.error || "আপলোড শুরু করা যায়নি।");

      const { jobId: newJobId, uploadUrl } = sessionData;
      setJobId(newJobId);

      const finalizeData = await uploadFileDirect(uploadUrl, file, (pct) => setProgress(pct));
      const geminiFile = finalizeData.file;

      await fetch(`/api/jobs/${newJobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "uploaded",
          geminiFileUri: geminiFile.uri,
          geminiFileName: geminiFile.name,
        }),
      });

      setStage("processing_file");
      if (geminiFile.state !== "ACTIVE") {
        await pollFileUntilActive(geminiFile.name);
      }

      setStage("generating");
      const genRes = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: newJobId }),
      });
      const genData = await genRes.json();
      if (!genRes.ok) throw new Error(genData.error || "স্ক্রিপ্ট তৈরি করা যায়নি।");

      setResult(genData.result);
      setStage("completed");
      loadJobs();
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 200);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "অজানা সমস্যা হয়েছে।");
      setStage("error");
      loadJobs();
    }
  }

  async function handleSaveEdits() {
    if (!jobId || !result) return;
    setSaving(true);
    try {
      await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resultJson: result }),
      });
      setDirty(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleSelectHistory(id: string) {
    setErrorMessage(null);
    const res = await fetch(`/api/jobs/${id}`);
    const data = await res.json();
    if (!res.ok) {
      setErrorMessage(data.error || "জব লোড করা যায়নি।");
      return;
    }
    const job = data.job;
    setJobId(job.id);
    setActiveMime(job.mimeType);
    setResult(job.resultJson || null);
    setStage(job.resultJson ? "completed" : "idle");
    setDirty(false);
    if (file) {
      // keep currently selected local file preview only if it matches this job's upload session
    }
    if (!job.resultJson) return;
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
  }

  async function handleDeleteHistory(id: string) {
    await fetch(`/api/jobs/${id}`, { method: "DELETE" });
    if (jobId === id) {
      setJobId(null);
      setResult(null);
      setStage("idle");
    }
    loadJobs();
  }

  const isBusy = stage === "uploading" || stage === "processing_file" || stage === "generating";

  return (
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[2fr_1fr] lg:px-8">
      {/* Main workflow column */}
      <div className="space-y-6">
        <section className="glass-panel animate-fade-up rounded-3xl p-6 sm:p-8">
          <h2
            className="mb-5 flex items-center gap-2 text-xl font-bold text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-fuchsia-600/30 text-sm">1</span>
            অডিও / ভিডিও আপলোড করুন
          </h2>

          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              pickFile(e.dataTransfer.files?.[0] || null);
            }}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
              dragOver
                ? "border-fuchsia-400 bg-fuchsia-500/10"
                : "border-white/15 bg-white/[0.02] hover:bg-white/[0.04]"
            }`}
          >
            <input
              type="file"
              accept="audio/*,video/*"
              className="hidden"
              onChange={(e) => pickFile(e.target.files?.[0] || null)}
            />
            <span className="mb-3 text-4xl">🎵🎬</span>
            {file ? (
              <>
                <p className="font-semibold text-white">{file.name}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {formatBytes(file.size)} · {file.type || "unknown type"}
                </p>
                <p className="mt-3 text-xs text-fuchsia-300 underline">অন্য ফাইল বাছুন</p>
              </>
            ) : (
              <>
                <p className="font-semibold text-slate-200">ফাইল টেনে আনুন অথবা ক্লিক করে বেছে নিন</p>
                <p className="mt-1 text-xs text-slate-500">যেকোনো অডিও/ভিডিও ফরম্যাট · সর্বোচ্চ ৩০০ এমবি</p>
              </>
            )}
          </label>

          <h2
            className="mb-5 mt-8 flex items-center gap-2 text-xl font-bold text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600/30 text-sm">2</span>
            ভাষা, টোন ও ক্যাটাগরি নির্বাচন করুন
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">
                🎤 অডিওটি কোন ভাষায়?
              </label>
              <select
                value={sourceLanguage}
                onChange={(e) => setSourceLanguage(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none focus:border-fuchsia-400/50"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.value} value={l.value} className="bg-slate-900">
                    {l.label}
                  </option>
                ))}
              </select>
              {sourceLanguage === "Other" && (
                <input
                  value={sourceOther}
                  onChange={(e) => setSourceOther(e.target.value)}
                  placeholder="ভাষার নাম লিখুন"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-sm text-white outline-none focus:border-fuchsia-400/50"
                />
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">
                📝 স্ক্রিপ্ট কোন ভাষায় চান?
              </label>
              <select
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                className="w-full rounded-xl border border-fuchsia-400/30 bg-fuchsia-500/[0.08] p-3 text-sm font-medium text-white outline-none focus:border-fuchsia-400/60"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.value} value={l.value} className="bg-slate-900">
                    {l.label}
                  </option>
                ))}
              </select>
              {targetLanguage === "Other" && (
                <input
                  value={targetOther}
                  onChange={(e) => setTargetOther(e.target.value)}
                  placeholder="ভাষার নাম লিখুন"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-sm text-white outline-none focus:border-fuchsia-400/50"
                />
              )}
            </div>
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-xs font-medium text-slate-400">🎭 টোন বেছে নিন (৫টির মধ্যে)</label>
            <div className="flex flex-wrap gap-2">
              {TONES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTone(t.value)}
                  className={`rounded-full border px-4 py-2 text-xs font-medium transition ${
                    tone === t.value
                      ? "border-fuchsia-400 bg-fuchsia-500/20 text-white"
                      : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-xs font-medium text-slate-400">🎬 ক্যাটাগরি বেছে নিন (৫টির মধ্যে)</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(c.value)}
                  className={`rounded-full border px-4 py-2 text-xs font-medium transition ${
                    category === c.value
                      ? "border-violet-400 bg-violet-500/20 text-white"
                      : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <label className="mb-1.5 block text-xs font-medium text-slate-400">
              ✍️ বাড়তি নির্দেশনা (ঐচ্ছিক)
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={2}
              placeholder="যেমনঃ চরিত্রদের নাম, বিশেষ শব্দচয়ন, প্রাসঙ্গিক তথ্য ইত্যাদি লিখতে পারেন..."
              className="w-full resize-y rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none focus:border-fuchsia-400/50"
            />
          </div>

          <h2
            className="mb-4 mt-8 flex items-center gap-2 text-xl font-bold text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600/30 text-sm">3</span>
            স্ক্রিপ্ট তৈরি করুন
          </h2>

          <button
            onClick={handleGenerate}
            disabled={isBusy || !file}
            className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-fuchsia-600 via-violet-600 to-indigo-600 px-6 py-4 text-center text-base font-bold text-white shadow-xl shadow-fuchsia-900/30 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isBusy ? "⏳ কাজ চলছে..." : "✨ Roy দিয়ে ডাবিং স্ক্রিপ্ট তৈরি করুন"}
          </button>

          {isBusy && (
            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between text-xs text-slate-400">
                <span>{STAGE_LABEL[stage]}</span>
                {stage === "uploading" && <span>{progress}%</span>}
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                {stage === "uploading" ? (
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-500 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                ) : (
                  <div className="h-full w-full animate-shimmer rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-400 to-violet-600" />
                )}
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
              ⚠️ {errorMessage}
            </div>
          )}
        </section>

        <div ref={resultRef}>
          {result && (
            <ScriptEditor
              result={result}
              onChange={(next) => {
                setResult(next);
                setDirty(true);
              }}
              mediaUrl={mediaUrl}
              mimeType={activeMime}
              sourceLabel={labelFor(LANGUAGES, resolvedSource)}
              targetLabel={labelFor(LANGUAGES, resolvedTarget)}
              toneLabel={labelFor(TONES, tone)}
              categoryLabel={labelFor(CATEGORIES, category)}
              onSave={handleSaveEdits}
              saving={saving}
              dirty={dirty}
            />
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        <HowItWorks />
        <HistoryPanel
          jobs={jobs}
          activeJobId={jobId}
          onSelect={handleSelectHistory}
          onDelete={handleDeleteHistory}
          loading={jobsLoading}
        />
      </div>
    </div>
  );
}
