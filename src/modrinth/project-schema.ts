import { z } from "zod";

export const ModrinthRuntimeSupportSchema = z.union([
  z.literal("required"),
  z.literal("optional"),
  z.literal("unsupported"),
  z.literal("unknown"),
]);

export const ModrinthProjectSchema = z.object({
  id: z.string(),
  // team: z.string(),
  // organization: z.string().optional().nullish(),
  // license: z.object({ id: z.string(), name: z.string(), url: z.string() }),

  project_type: z.union([
    z.literal("mod"),
    z.literal("modpack"),
    z.literal("resourcepack"),
    z.literal("shader"),
  ]),

  client_side: ModrinthRuntimeSupportSchema,
  server_side: ModrinthRuntimeSupportSchema,

  // loaders: z.string().array(),
  // game_versions: z.string().array(),
  versions: z.string().array(),

  slug: z.string().optional(),
  title: z.string().nullish(),
  // description: z.string().nullish(),
  // categories: z.string().array(),
  // additional_categories: z.string().array(),

  // body: z.string(),
  // body_url: z.string().nullish(),
  // status: z.union([
  //   z.literal("approved"),
  //   z.literal("archived"),
  //   z.literal("rejected"),
  //   z.literal("draft"),
  //   z.literal("unlisted"),
  //   z.literal("processing"),
  //   z.literal("withheld"),
  //   z.literal("scheduled"),
  //   z.literal("private"),
  //   z.literal("unknown"),
  // ]),
  // requested_status: z
  //   .union([
  //     z.literal("approved"),
  //     z.literal("archived"),
  //     z.literal("unlisted"),
  //     z.literal("private"),
  //     z.literal("draft"),
  //   ])
  //   .nullish(),

  // issues_url: z.string().url().nullish(),
  // source_url: z.string().url().nullish(),
  // wiki_url: z.string().url().nullish(),
  // discord_url: z.string().url().nullish(),
  // donation_urls: z.object({ id: z.string(), platform: z.string(), url: z.string().url() }).array(),
  // icon_url: z.string().url().nullish(),
  // gallery: z
  //   .object({
  //     url: z.string().url(),
  //     raw_url: z.string().url().nullish(),
  //     featured: z.boolean(),
  //     title: z.string().nullish(),
  //     description: z.string().nullish(),
  //     created: z.string().date(),
  //     ordering: z.number(),
  //   })
  //   .array(),

  // published: z.string().date(),
  // updated: z.string().date(),
  // approved: z.string().date(),
  // queued: z.string().date(),

  // downloads: z.number(),
  // followers: z.number(),

  // thread_id: z.string(),
  // moderator_message: z.unknown(),

  // color: z.number().nullish(),
  // monetization_status: z.union([
  //   z.literal("monetized"),
  //   z.literal("demonetized"),
  //   z.literal("force-demonetized"),
  // ]),
});

export type ModrinthProject = z.infer<typeof ModrinthProjectSchema>;
