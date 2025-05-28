import "dotenv/config";
import { z } from "zod";

const ConfigSchema = z.object({
  modrinthPat: z.string({ required_error: "Missing Modrinth personal access token" }).min(1),
  userAgentPrefix: z.string().optional().default("config_split_client"),
});

const e = (key: string) => process.env[key];

const getConfig = () =>
  ConfigSchema.parse({
    modrinthPat: e("MODRINTH_PAT"),
    userAgentPrefix: e("USER_AGENT_PREFIX"),
  });

export const config = getConfig();
