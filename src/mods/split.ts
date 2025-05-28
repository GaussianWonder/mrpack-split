import { writeFile } from "node:fs/promises";
import type { ModrinthMetadata } from "../modrinth/fetch";
import type { ModrinthIndex, ModrinthIndexFile } from "../modrinth/index-schema";
import type { ModrinthProject } from "../modrinth/project-schema";
import { tableString } from "../utils/console-table";

const overrideIndex = (
  base: ModrinthIndex,
  partial: Partial<ModrinthIndex>,
  name = "Subset",
): ModrinthIndex => ({
  ...base,
  ...partial,
  name: `${base.name} ${name}`,
  summary: `${name} config of ${base.name}. ${base.summary}`,
});

const extractFiles = (
  index: ModrinthIndex,
  { fileAssociations }: ModrinthMetadata,
  predicate: (file: ModrinthIndexFile, project: ModrinthProject) => boolean,
): ModrinthIndexFile[] => {
  const subset: ModrinthIndexFile[] = [];
  for (const file of index.files) {
    if (fileAssociations.has(file.path)) {
      const { projects } = fileAssociations.get(file.path);
      if (projects.some(project => predicate(file, project))) subset.push(file);
    }
  }
  return subset;
};

const extractServerFiles = (index: ModrinthIndex, meta: ModrinthMetadata): ModrinthIndexFile[] =>
  extractFiles(index, meta, (file, project) => {
    if (project.server_side === "required") return true;
    if (project.server_side === "unsupported") return false;
    if (["optional", "unknown"].includes(project.server_side)) {
      if (file?.env?.server && file.env.server === "unsupported") return false;
      return true;
    }
    return true;
  });

const extractClientFiles = (index: ModrinthIndex, meta: ModrinthMetadata): ModrinthIndexFile[] =>
  extractFiles(index, meta, (file, project) => {
    if (project.client_side === "required") return true;
    if (project.client_side === "unsupported") return false;
    if (["optional", "unknown"].includes(project.client_side)) {
      if (file?.env?.client && file.env.client === "unsupported") return false;
      return true;
    }
    return true;
  });

const debugProjectFile = (
  debugKey: "client_side" | "server_side",
  index: ModrinthIndex,
  files: ModrinthIndexFile[],
  { fileAssociations }: ModrinthMetadata,
) => {
  const fileTable = files.flatMap(file => {
    if (!fileAssociations.has(file.path)) return [];
    const { projects } = fileAssociations.get(file.path);
    return projects.map(project => ({
      id: project.id,
      name: `${project.title || "N/A"} (${project.slug || "N/A"})`,
      path: file.path,
      modrinth: project[debugKey],
      mrpack: (debugKey === "server_side" ? file.env.server : file.env.client) || "N/A",
    }));
  });
  fileTable.sort((a, b) => a.modrinth.localeCompare(b.modrinth));
  writeFile(`${index.name}_${debugKey}.log`, tableString(fileTable)); // async, does not wait for this to finish
};

const debugDiff = (
  index: ModrinthIndex,
  debugKey: "client_side" | "server_side",
  current: ModrinthIndexFile[],
  { fileAssociations }: ModrinthMetadata,
) => {
  const removed = index.files
    .filter(baseFile => !current.some(currentFile => baseFile.path === currentFile.path))
    .flatMap(file => {
      if (fileAssociations.has(file.path)) return fileAssociations.get(file.path).projects;
      return [];
    })
    .map(({ id, slug, title }) => `${title || slug || id}`);
  writeFile(`${index.name}_${debugKey}_removed.log`, tableString(removed)); // async, does not wait for this to finish
};

export const splitByRuntime = (
  index: ModrinthIndex,
  metadata: ModrinthMetadata,
): { server: ModrinthIndex; client: ModrinthIndex } => {
  const serverBin: ModrinthIndexFile[] = extractServerFiles(index, metadata);
  const clientBin: ModrinthIndexFile[] = extractClientFiles(index, metadata);

  debugProjectFile("server_side", index, serverBin, metadata);
  debugProjectFile("client_side", index, clientBin, metadata);

  if (serverBin.length < index.files.length) {
    console.log(`Saved server of ${index.files.length - serverBin.length} client-only mods.`);
    debugDiff(index, "server_side", serverBin, metadata);
  }

  if (clientBin.length < index.files.length) {
    console.log(`Saved client of ${index.files.length - clientBin.length} server-only mods.`);
    debugDiff(index, "client_side", clientBin, metadata);
  }

  return {
    server: overrideIndex(index, { files: serverBin }, "Server"),
    client: overrideIndex(index, { files: clientBin }, "Client"),
  };
};
