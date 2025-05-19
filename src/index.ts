import { Command } from 'commander';
import JSZip from 'jszip';
import { stat, readFile, writeFile } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path';

const command = new Command()
  .description('split modrinth modpack into client and server configs')
  .argument('<input-file>', 'modrinth modpack export')
  .action(async (fileName) => {
    const dirName = dirname(fileName);
    const baseName = basename(fileName);

    const fileStat = await stat(fileName);
    if (!fileStat.isFile() || fileStat.isSymbolicLink()) throw new Error(`${fileName} not a file`);

    const modrinthConfig = await new JSZip().loadAsync(await readFile(fileName));    
    /**
     * Keep this in memory, avoid reading the file 2 times.
     */
    const modrinthConfigBuffer = await modrinthConfig.generateAsync({ type: 'nodebuffer' });

    const indexEntry = modrinthConfig.file('modrinth.index.json');
    if (!indexEntry) throw new Error('Not a modrinth modpack, missing "modrinth.index.json"');

    /**
     * Keep this in memory, avoid reading the file 2 times.
     */
    const indexData = JSON.parse(await indexEntry.async('string'));

    const serverFiles: any[] = indexData.files.filter((mod: any) => mod.env.server === 'required');
    const clientFiles: any[] = indexData.files.filter((mod: any) => mod.env.client === 'required');

    if (serverFiles.length === clientFiles.length && serverFiles.length === indexData.files.length) {
      console.log('No difference between generated configs.');
      return;
    }

    /**
     * Create a new "modrinth.index.json".
     */
    const childIndexConfig = (name: string, override: any) => ({
      ...indexData,
      ...override,
      name: `${indexData.name} ${name}`,
      summary: `${name} config of ${indexData.name}`,
    });

    /**
     * Clone a ".mrpack".
     */
    const createConfig = async (newIndex: any) => {
      const config = await new JSZip().loadAsync(modrinthConfigBuffer);
      return config
        .remove('modrinth.index.json')
        .file('modrinth.index.json', JSON.stringify(newIndex, undefined, 2));
    };

    /**
     * Save a ".mrpack".
     */
    const saveChildConfig = async (name: string, override: any) => {
      const config = await createConfig(childIndexConfig(
        name,
        override,
      ));

      const buf = await config.generateAsync({ type: 'nodebuffer' });
      await writeFile(join(dirName, `${name}_${baseName}`), buf);
    };

    await saveChildConfig(
      'server',
      { files: indexData.files.filter((mod: any) => mod.env.server === 'required') },
    );

    await saveChildConfig(
      'client',
      { files: indexData.files.filter((mod: any) => mod.env.client === 'required') },
    );
  });

command.parse();
