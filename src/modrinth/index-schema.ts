import { z } from "zod";

export const ModrinthIndexFileSchema = z
  .object({
    path: z.string(),
    // hashes: z.object({ sha1: z.string(), sha512: z.string() }),
    env: z
      .object({
        server: z.string().optional(),
        client: z.string().optional(),
      })
      .optional()
      .default({}),
    downloads: z.string().url().array(),
    // fileSize: z.number(),
  })
  .passthrough();

export type ModrinthIndexFile = z.infer<typeof ModrinthIndexFileSchema>;

export const ModrinthIndexSchema = z
  .object({
    game: z.string(),
    name: z.string(),
    summary: z.string(),
    formatVersion: z.number(),
    versionId: z.string(),
    files: ModrinthIndexFileSchema.array(),
    // dependencies: z.record(z.string()),
  })
  .passthrough();

export type ModrinthIndex = z.infer<typeof ModrinthIndexSchema>;
