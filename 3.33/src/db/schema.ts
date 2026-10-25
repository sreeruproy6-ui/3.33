import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const dubbingJobs = pgTable("dubbing_jobs", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  mimeType: text("mime_type").notNull(),
  fileSizeBytes: integer("file_size_bytes").notNull().default(0),
  durationLabel: text("duration_label"),

  sourceLanguage: text("source_language").notNull(),
  targetLanguage: text("target_language").notNull(),
  tone: text("tone").notNull(),
  category: text("category").notNull(),
  instructions: text("instructions"),

  status: text("status").notNull().default("uploading"),
  // uploading | uploaded | processing_file | generating | completed | error

  geminiFileUri: text("gemini_file_uri"),
  geminiFileName: text("gemini_file_name"),

  resultJson: jsonb("result_json"),
  errorMessage: text("error_message"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type DubbingJob = typeof dubbingJobs.$inferSelect;
export type NewDubbingJob = typeof dubbingJobs.$inferInsert;
