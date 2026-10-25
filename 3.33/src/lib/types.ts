export interface DubbingSegment {
  index?: number;
  startTime: string;
  endTime: string;
  speaker?: string;
  originalText: string;
  translatedText: string;
  toneNote?: string;
}

export interface DubbingScriptResult {
  detectedSourceLanguage?: string;
  titleGuess?: string;
  contentSummary?: string;
  overallToneGuide?: string;
  segments: DubbingSegment[];
}

export type JobStatus =
  | "uploading"
  | "uploaded"
  | "processing_file"
  | "generating"
  | "completed"
  | "error";

export interface JobSummary {
  id: string;
  title: string;
  mimeType: string;
  fileSizeBytes: number;
  sourceLanguage: string;
  targetLanguage: string;
  tone: string;
  category: string;
  status: JobStatus;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface JobDetail extends JobSummary {
  instructions?: string | null;
  geminiFileUri?: string | null;
  geminiFileName?: string | null;
  resultJson?: DubbingScriptResult | null;
}
