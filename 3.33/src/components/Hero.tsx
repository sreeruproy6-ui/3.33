const BADGES = [
  "🎙️ অডিও / ভিডিও আপলোড",
  "🌐 ভাষা শনাক্তকরণ",
  "📝 নিখুঁত বাংলা ডাবিং স্ক্রিপ্ট",
  "⏱️ টাইমকোডসহ সেগমেন্ট",
  "🎭 ৫টি টোন নির্বাচন",
  "🎬 ৫টি কন্টেন্ট ক্যাটাগরি",
  "✏️ সরাসরি এডিট সুবিধা",
  "🔊 ইন-ব্রাউজার প্লেয়ার",
];

export default function Hero() {
  return (
    <header className="relative overflow-hidden border-b border-white/10 pb-10 pt-14 sm:pt-20">
      {/* Motion graphics blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-blob absolute -left-24 -top-24 h-80 w-80 rounded-full bg-fuchsia-600/30 blur-3xl" />
        <div className="animate-blob-slow absolute -right-20 top-10 h-96 w-96 rounded-full bg-violet-600/30 blur-3xl" />
        <div className="animate-blob-delay absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
      </div>

      <div className="relative mx-auto flex max-w-6xl flex-col items-center px-6 text-center">
        <div className="animate-float mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-violet-600 text-3xl shadow-[0_0_40px_rgba(168,85,247,0.6)]">
          🎬
        </div>

        <p className="animate-fade-up mb-3 rounded-full border border-white/15 bg-white/5 px-4 py-1 text-xs font-medium tracking-wide text-fuchsia-200">
          Gemini AI চালিত ডাবিং স্ক্রিপ্ট স্টুডিও
        </p>

        <h1
          className="animate-fade-up bg-gradient-to-br from-white via-fuchsia-100 to-violet-300 bg-clip-text text-4xl font-extrabold leading-tight text-transparent sm:text-6xl"
          style={{ fontFamily: "var(--font-display)", animationDelay: "0.1s" }}
        >
          Roy <span className="text-fuchsia-400">—</span> The Script Writer
        </h1>
        <p
          className="animate-fade-up mt-2 text-xl font-semibold text-fuchsia-200 sm:text-2xl"
          style={{ animationDelay: "0.15s" }}
        >
          রয়, আপনার ব্যক্তিগত ডাবিং স্ক্রিপ্ট রাইটার
        </p>

        <p
          className="animate-fade-up mt-5 max-w-2xl text-balance text-sm leading-relaxed text-slate-300 sm:text-base"
          style={{ animationDelay: "0.2s" }}
        >
          যেকোনো ভাষার অডিও বা ভিডিও আপলোড করুন (সর্বোচ্চ ৩০০ এমবি) — Roy তা শুনে,
          টাইমকোডসহ, একদম নিখুঁত ও প্রাঞ্জল <b className="text-white">বাংলা</b> ডাবিং
          স্ক্রিপ্ট লিখে দেবে। টোন, ক্যাটাগরি বেছে নিন, শুনে দেখুন, প্রয়োজনে এডিট
          করুন — ডাবিং-এর জন্য রেডি!
        </p>

        <div className="relative mt-9 w-full max-w-4xl overflow-hidden">
          <div className="flex w-max animate-marquee gap-3">
            {[...BADGES, ...BADGES].map((b, i) => (
              <span
                key={i}
                className="whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-200"
              >
                {b}
              </span>
            ))}
          </div>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#0a0a18] to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#0a0a18] to-transparent" />
        </div>
      </div>
    </header>
  );
}
