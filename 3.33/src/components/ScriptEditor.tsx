"use client";

import { useRef, useState } from "react";
import type { DubbingScriptResult } from "@/lib/types";
import { parseTimecodeToSeconds } from "@/lib/clientUpload";

interface Props {
  result: DubbingScriptResult;
  onChange: (next: DubbingScriptResult) => void;
  mediaUrl: string | null;
  mimeType: string;
  sourceLabel: string;
  targetLabel: string;
  toneLabel: string;
  categoryLabel: string;
  onSave: () => void;
  saving: boolean;
  dirty: boolean;
}

export default function ScriptEditor({
  result,
  onChange,
  mediaUrl,
  mimeType,
  sourceLabel,
  targetLabel,
  toneLabel,
  categoryLabel,
  onSave,
  saving,
  dirty,
}: Props) {
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const isVideo = mimeType.startsWith("video/");

  const seekTo = (tc: string, idx: number) => {
    const t = parseTimecodeToSeconds(tc);
    if (mediaRef.current) {
      mediaRef.current.currentTime = t;
      mediaRef.current.play().catch(() => undefined);
    }
    setActiveIndex(idx);
  };

  const updateSegment = (idx: number, field: string, value: string) => {
    const segments = result.segments.slice();
    segments[idx] = { ...segments[idx], [field]: value };
    onChange({ ...result, segments });
  };

  const exportText = () => {
    const lines = result.segments.map(
      (s, i) =>
        `${i + 1}\n${s.startTime} --> ${s.endTime}${s.speaker ? ` | ${s.speaker}` : ""}\n[${sourceLabel}] ${s.originalText}\n[${targetLabel}] ${s.translatedText}${
          s.toneNote ? `\n(টোন: ${s.toneNote})` : ""
        }\n`
    );
    const header = `Roy — The Script Writer\nসারাংশ: ${result.contentSummary || "-"}\nসামগ্রিক টোন নির্দেশনা: ${
      result.overallToneGuide || "-"
    }\nটোন: ${toneLabel} | ক্যাটাগরি: ${categoryLabel}\n\n`;
    const blob = new Blob([header + lines.join("\n")], {
      type: "text/plain;charset=utf-8",
    });
    downloadBlob(blob, "roy-dubbing-script.txt");
  };

  const exportSrt = () => {
    const toSrtTime = (tc: string) => {
      const secs = parseTimecodeToSeconds(tc);
      const h = Math.floor(secs / 3600);
      const m = Math.floor((secs % 3600) / 60);
      const s = Math.floor(secs % 60);
      const ms = Math.round((secs - Math.floor(secs)) * 1000);
      const pad = (n: number, l = 2) => String(n).padStart(l, "0");
      return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`;
    };
    const lines = result.segments.map(
      (s, i) =>
        `${i + 1}\n${toSrtTime(s.startTime)} --> ${toSrtTime(s.endTime)}\n${s.translatedText}\n`
    );
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    downloadBlob(blob, "roy-dubbing-script.srt");
  };

  return (
    <div className="animate-fade-up space-y-5">
      <div className="glass-panel rounded-3xl p-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Chip label={`🌐 মূল ভাষা: ${result.detectedSourceLanguage || sourceLabel}`} />
          <Chip label={`🎯 স্ক্রিপ্ট ভাষা: ${targetLabel}`} />
          <Chip label={`🎭 টোন: ${toneLabel}`} />
          <Chip label={`🎬 ক্যাটাগরি: ${categoryLabel}`} />
        </div>

        {mediaUrl ? (
          isVideo ? (
            <video
              ref={mediaRef as React.RefObject<HTMLVideoElement>}
              src={mediaUrl}
              controls
              className="w-full rounded-2xl border border-white/10 bg-black"
            />
          ) : (
            <audio
              ref={mediaRef as React.RefObject<HTMLAudioElement>}
              src={mediaUrl}
              controls
              className="w-full"
            />
          )
        ) : (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-4 text-center text-xs text-slate-400">
            এই পুরনো জবের জন্য মূল মিডিয়া ফাইল আর পাওয়া যাচ্ছে না (শুধু স্ক্রিপ্ট দেখা যাবে)।
          </div>
        )}

        {result.contentSummary && (
          <p className="mt-4 rounded-xl bg-white/5 p-3 text-sm text-slate-200">
            <b className="text-fuchsia-300">সারাংশ:</b> {result.contentSummary}
          </p>
        )}
        {result.overallToneGuide && (
          <p className="mt-2 rounded-xl bg-white/5 p-3 text-sm text-slate-200">
            <b className="text-violet-300">সামগ্রিক টোন নির্দেশনা:</b>{" "}
            {result.overallToneGuide}
          </p>
        )}
      </div>

      <div className="glass-panel rounded-3xl p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3
            className="text-lg font-bold text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            📝 ডাবিং স্ক্রিপ্ট ({result.segments.length}টি সেগমেন্ট)
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onSave}
              disabled={saving}
              className="rounded-full bg-gradient-to-r from-fuchsia-600 to-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-fuchsia-900/30 transition hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "সংরক্ষণ হচ্ছে..." : dirty ? "💾 পরিবর্তন সংরক্ষণ করুন" : "✅ সংরক্ষিত"}
            </button>
            <button
              onClick={exportText}
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
            >
              ⬇️ TXT ডাউনলোড
            </button>
            <button
              onClick={exportSrt}
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
            >
              ⬇️ SRT ডাউনলোড
            </button>
          </div>
        </div>

        <div className="scrollbar-thin max-h-[70vh] space-y-3 overflow-y-auto pr-1">
          {result.segments.map((seg, idx) => (
            <div
              key={idx}
              className={`rounded-2xl border p-4 transition ${
                activeIndex === idx
                  ? "border-fuchsia-400/50 bg-fuchsia-500/10"
                  : "border-white/10 bg-white/[0.03]"
              }`}
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <button
                  onClick={() => seekTo(seg.startTime, idx)}
                  disabled={!mediaUrl}
                  className="flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1 font-mono text-xs text-emerald-300 ring-1 ring-emerald-400/30 transition hover:bg-black/50 disabled:opacity-50"
                >
                  ▶ {seg.startTime} — {seg.endTime}
                </button>
                <input
                  value={seg.speaker || ""}
                  onChange={(e) => updateSegment(idx, "speaker", e.target.value)}
                  placeholder="স্পিকার (ঐচ্ছিক)"
                  className="w-36 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 outline-none focus:border-fuchsia-400/50"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-500">
                    মূল ভাষা ({sourceLabel})
                  </label>
                  <textarea
                    value={seg.originalText}
                    onChange={(e) => updateSegment(idx, "originalText", e.target.value)}
                    rows={2}
                    className="w-full resize-y rounded-xl border border-white/10 bg-white/5 p-2.5 text-sm text-slate-300 outline-none focus:border-white/30"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-fuchsia-300">
                    ডাবিং স্ক্রিপ্ট ({targetLabel})
                  </label>
                  <textarea
                    value={seg.translatedText}
                    onChange={(e) => updateSegment(idx, "translatedText", e.target.value)}
                    rows={2}
                    className="w-full resize-y rounded-xl border border-fuchsia-400/20 bg-fuchsia-500/[0.06] p-2.5 text-sm font-medium text-white outline-none focus:border-fuchsia-400/50"
                  />
                </div>
              </div>

              <div className="mt-2">
                <input
                  value={seg.toneNote || ""}
                  onChange={(e) => updateSegment(idx, "toneNote", e.target.value)}
                  placeholder="🎭 ডেলিভারি/টোন নির্দেশনা (ঐচ্ছিক)"
                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs italic text-amber-200 outline-none focus:border-amber-300/40"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
      {label}
    </span>
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
