import Hero from "@/components/Hero";
import StudioApp from "@/components/StudioApp";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Hero />
      <StudioApp />
      <footer className="border-t border-white/10 py-8 text-center text-xs text-slate-500">
        🎬 Roy — The Script Writer · Gemini AI দিয়ে তৈরি বাংলা ডাবিং স্ক্রিপ্ট স্টুডিও
      </footer>
    </main>
  );
}
