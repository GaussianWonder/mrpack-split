import { readFile, stat, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { Command } from "commander";
import JSZip from "jszip";
import { fetchAllModrinthMetadata } from "./modrinth/fetch";
import { type ModrinthIndex, ModrinthIndexSchema } from "./modrinth/index-schema";
import { splitByRuntime } from "./mods/split";

const command = new Command()
  .description("split modrinth modpack into client and server configs")
  .argument("<input-file>", "modrinth modpack export")
  .action(async fileName => {
    const dirName = dirname(fileName);
    const baseName = basename(fileName);

    const fileStat = await stat(fileName);
    if (!fileStat.isFile() || fileStat.isSymbolicLink()) throw new Error(`${fileName} not a file`);

    const mrpack = await new JSZip().loadAsync(await readFile(fileName));
    /**
     * Keep this in memory, avoid reading the file 2 times.
     */
    const mrpackBuf = await mrpack.generateAsync({ type: "nodebuffer" });

    const indexEntry = mrpack.file("modrinth.index.json");
    if (!indexEntry) throw new Error('Not a modrinth modpack, missing "modrinth.index.json"');

    /**
     * Keep this in memory, avoid reading the file 2 times.
     */
    const main = ModrinthIndexSchema.parse(JSON.parse(await indexEntry.async("string")));

    const metadata = await fetchAllModrinthMetadata(main.files);
    const { server, client } = splitByRuntime(main, metadata);

    if (server.files.length === client.files.length && server.files.length === main.files.length) {
      console.log("No difference between generated configs.");
      return;
    }

    /**
     * Clone a ".mrpack".
     */
    const cloneWithNewIndex = async (newIndex: ModrinthIndex) => {
      const config = await new JSZip().loadAsync(mrpackBuf);
      return config
        .remove("modrinth.index.json")
        .file("modrinth.index.json", JSON.stringify(newIndex, undefined, 2));
    };

    /**
     * Save a ".mrpack".
     */
    const saveChildConfig = async (name: string, config: JSZip) => {
      const buf = await config.generateAsync({ type: "nodebuffer" });
      await writeFile(join(dirName, `${name}_${baseName}`), buf);
    };

    await saveChildConfig("server", await cloneWithNewIndex(server));
    await saveChildConfig("client", await cloneWithNewIndex(client));
  });

command.parse();
