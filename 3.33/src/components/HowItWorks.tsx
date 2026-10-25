const STEPS = [
  {
    icon: "📤",
    title: "আপলোড করুন",
    desc: "অডিও বা ভিডিও ফাইল (সর্বোচ্চ ৩০০ এমবি) যেকোনো ফরম্যাটে টেনে এনে ছাড়ুন বা বেছে নিন।",
  },
  {
    icon: "🌐",
    title: "ভাষা নির্বাচন করুন",
    desc: "অডিওটি কোন ভাষায় এবং স্ক্রিপ্ট কোন ভাষায় (ডিফল্ট বাংলা) চান তা বেছে নিন।",
  },
  {
    icon: "🎭",
    title: "টোন ও ক্যাটাগরি দিন",
    desc: "৫টি টোন ও ৫টি কন্টেন্ট ক্যাটাগরি থেকে বেছে নিন, চাইলে বাড়তি নির্দেশনা লিখুন।",
  },
  {
    icon: "✨",
    title: "Roy প্রসেস করবে",
    desc: "Gemini AI পুরো অডিও শুনে টাইমকোডসহ নিখুঁত ডাবিং স্ক্রিপ্ট তৈরি করবে।",
  },
  {
    icon: "🎧",
    title: "শুনুন, এডিট করুন",
    desc: "প্লেয়ারে শুনতে শুনতে লেখাগুলো মিলিয়ে নিন, প্রয়োজনে সরাসরি এডিট করুন।",
  },
];

export default function HowItWorks() {
  return (
    <div className="glass-panel animate-fade-up rounded-3xl p-6">
      <h2
        className="mb-1 text-lg font-bold text-white"
        style={{ fontFamily: "var(--font-display)" }}
      >
        কীভাবে কাজ করে
      </h2>
      <p className="mb-5 text-xs text-slate-400">৫টি সহজ ধাপে ডাবিং স্ক্রিপ্ট তৈরি</p>
      <ol className="space-y-5">
        {STEPS.map((s, i) => (
          <li key={i} className="relative flex gap-3 pl-1">
            {i !== STEPS.length - 1 && (
              <span className="absolute left-[19px] top-10 h-[calc(100%-6px)] w-px bg-gradient-to-b from-fuchsia-500/50 to-transparent" />
            )}
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-violet-500/20 text-lg ring-1 ring-white/10">
              {s.icon}
            </span>
            <div>
              <p className="text-sm font-semibold text-white">{s.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-400">{s.desc}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4">
        <p className="text-xs leading-relaxed text-emerald-200">
          💡 <b>টিপস:</b> সবচেয়ে ভালো ফলাফলের জন্য পরিষ্কার শব্দসহ ফাইল আপলোড করুন।
          বাংলা ডাবিং-এর ক্ষেত্রে Roy বিশেষভাবে প্রাঞ্জল ও লিপ-সিঙ্ক বান্ধব
          স্ক্রিপ্ট লেখার চেষ্টা করে।
        </p>
      </div>
    </div>
  );
}
