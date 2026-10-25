// Client-side helper: uploads the raw file bytes DIRECTLY to Google's Gemini
// Files API resumable upload URL. The file never passes through our own
// server, so there is no server body-size limit to worry about even for
// 300MB+ media files.

export interface GeminiFinalizeResponse {
  file: {
    name: string;
    uri: string;
    mimeType: string;
    state: string;
  };
}

export function uploadFileDirect(
  uploadUrl: string,
  file: File,
  onProgress: (pct: number) => void
): Promise<GeminiFinalizeResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", uploadUrl, true);
    xhr.setRequestHeader("X-Goog-Upload-Offset", "0");
    xhr.setRequestHeader("X-Goog-Upload-Command", "upload, finalize");

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const json = JSON.parse(xhr.responseText);
          resolve(json);
        } catch {
          reject(new Error("আপলোড সম্পন্ন হয়েছে কিন্তু প্রতিক্রিয়া পড়া যায়নি।"));
        }
      } else {
        reject(new Error(`ফাইল আপলোড ব্যর্থ হয়েছে (status ${xhr.status})।`));
      }
    };

    xhr.onerror = () => reject(new Error("নেটওয়ার্ক সমস্যার কারণে আপলোড ব্যর্থ হয়েছে।"));
    xhr.onabort = () => reject(new Error("আপলোড বাতিল করা হয়েছে।"));

    xhr.send(file);
  });
}

export function parseTimecodeToSeconds(tc: string | undefined): number {
  if (!tc) return 0;
  const parts = tc.split(":").map((p) => parseFloat(p));
  if (parts.some((p) => Number.isNaN(p))) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
}

export function formatBytes(bytes: number): string {
  if (!bytes) return "0 MB";
  const mb = bytes / (1024 * 1024);
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}
