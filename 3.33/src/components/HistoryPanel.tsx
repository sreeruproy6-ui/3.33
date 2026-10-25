"use client";

import type { JobSummary } from "@/lib/types";
import { labelFor, LANGUAGES, TONES, CATEGORIES } from "@/lib/options";

const STATUS_LABEL: Record<string, string> = {
  uploading: "⬆️ আপলোড হচ্ছে",
  uploaded: "✅ আপলোড সম্পন্ন",
  processing_file: "⚙️ প্রসেসিং",
  generating: "✨ স্ক্রিপ্ট তৈরি হচ্ছে",
  completed: "🟢 সম্পন্ন",
  error: "🔴 সমস্যা",
};

interface Props {
  jobs: JobSummary[];
  activeJobId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  loading: boolean;
}

export default function HistoryPanel({ jobs, activeJobId, onSelect, onDelete, loading }: Props) {
  return (
    <div className="glass-panel animate-fade-up rounded-3xl p-6">
      <h2 className="mb-1 text-lg font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
        🗂️ পূর্বের কাজ
      </h2>
      <p className="mb-4 text-xs text-slate-400">সর্বশেষ ৫০টি জব এখানে দেখা যাবে</p>

      {loading && <p className="text-xs text-slate-500">লোড হচ্ছে...</p>}
      {!loading && jobs.length === 0 && (
        <p className="rounded-xl border border-dashed border-white/10 p-3 text-center text-xs text-slate-500">
          এখনো কোনো কাজ তৈরি হয়নি।
        </p>
      )}

      <div className="scrollbar-thin max-h-[480px] space-y-2 overflow-y-auto pr-1">
        {jobs.map((job) => (
          <div
            key={job.id}
            onClick={() => onSelect(job.id)}
            className={`group cursor-pointer rounded-2xl border p-3 transition ${
              activeJobId === job.id
                ? "border-fuchsia-400/50 bg-fuchsia-500/10"
                : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="line-clamp-1 flex-1 text-sm font-medium text-white">{job.title}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(job.id);
                }}
                className="shrink-0 text-xs text-slate-500 opacity-0 transition hover:text-rose-400 group-hover:opacity-100"
                title="মুছে ফেলুন"
              >
                🗑️
              </button>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5 text-[10px] text-slate-400">
              <span>{labelFor(LANGUAGES, job.sourceLanguage)} → {labelFor(LANGUAGES, job.targetLanguage)}</span>
              <span>•</span>
              <span>{labelFor(TONES, job.tone)}</span>
              <span>•</span>
              <span>{labelFor(CATEGORIES, job.category)}</span>
            </div>
            <p className="mt-1.5 text-[10px] font-medium text-slate-300">
              {STATUS_LABEL[job.status] || job.status}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
