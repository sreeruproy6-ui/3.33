// Shared option lists for both client UI and server-side validation/prompting.

export interface Option {
  value: string;
  label: string;
}

export const LANGUAGES: Option[] = [
  { value: "Bangla", label: "বাংলা" },
  { value: "Hindi", label: "হিন্দি" },
  { value: "English", label: "ইংরেজি" },
  { value: "Urdu", label: "উর্দু" },
  { value: "Tamil", label: "তামিল" },
  { value: "Telugu", label: "তেলেগু" },
  { value: "Nepali", label: "নেপালি" },
  { value: "Arabic", label: "আরবি" },
  { value: "Spanish", label: "স্প্যানিশ" },
  { value: "French", label: "ফরাসি" },
  { value: "Turkish", label: "তুর্কি" },
  { value: "Indonesian", label: "ইন্দোনেশীয়" },
  { value: "Chinese", label: "চীনা (ম্যান্ডারিন)" },
  { value: "Japanese", label: "জাপানি" },
  { value: "Korean", label: "কোরিয়ান" },
  { value: "Other", label: "অন্যান্য" },
];

export const TONES: Option[] = [
  { value: "natural", label: "স্বাভাবিক / কথোপকথন" },
  { value: "emotional", label: "আবেগঘন / নাটকীয়" },
  { value: "comedic", label: "হাস্যরসাত্মক / মজার" },
  { value: "documentary", label: "গম্ভীর / ডকুমেন্টারি" },
  { value: "promotional", label: "উদ্দীপনাপূর্ণ / বিজ্ঞাপনমূলক" },
];

export const CATEGORIES: Option[] = [
  { value: "tv_drama", label: "টিভি শো / নাটক" },
  { value: "animation", label: "অ্যানিমেশন / কার্টুন" },
  { value: "movie", label: "মুভি / সিনেমা" },
  { value: "documentary", label: "ডকুমেন্টারি" },
  { value: "ad_promo", label: "বিজ্ঞাপন / প্রোমো / ইউটিউব" },
];

export const MAX_FILE_SIZE_BYTES = 300 * 1024 * 1024; // 300 MB

export function labelFor(options: Option[], value: string): string {
  return options.find((o) => o.value === value)?.label || value;
}
