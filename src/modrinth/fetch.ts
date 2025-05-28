import { filterOkParsedParams, urlParamExtractor } from "../utils/param-extract";
import type { InferPromiseType } from "../utils/types";
import { getUnique } from "../utils/unique";
import { modrinth } from "./api";
import type { ModrinthIndexFile } from "./index-schema";
import { type ModrinthProject, ModrinthProjectSchema } from "./project-schema";

export const fetchModrinthFileMetadata = async (id: string) => {
  const res = await modrinth.get(`project/${id}`);
  return ModrinthProjectSchema.parse(res.data);
};

export const fetchModrinthFilesMetadata = async (ids: string[]) => {
  const res = await modrinth.get("projects", { params: { ids: JSON.stringify(ids) } });
  return ModrinthProjectSchema.array().parse(res.data);
};

const extractCDNParams = urlParamExtractor(
  "https://cdn.modrinth.com/data/:id/versions/:version/:name",
);

const getModrinthMetadataParams = (file: ModrinthIndexFile) =>
  file.downloads.map(extractCDNParams).filter(filterOkParsedParams);

const simpleStore = <T>(createNew: () => T) => {
  const store = new Map<string, T>();

  return {
    has: (key: string) => store.has(key),
    get: (key: string) => {
      const entry = store.get(key);
      if (entry) return entry;
      const newEntry = createNew();
      store.set(key, newEntry);
      return newEntry;
    },
    delete: (key: string) => store.delete(key),
  };
};

export const fetchAllModrinthMetadata = async (files: ModrinthIndexFile[]) => {
  const fileAssociations = simpleStore(() => ({
    ids: [] as string[],
    projects: [] as ModrinthProject[],
  }));
  const projectAssociations = simpleStore(() => ({
    file: "",
  }));

  const projectsPromise = files.map(async file => {
    const assoc = fileAssociations.get(file.path);
    const params = getModrinthMetadataParams(file);
    await Promise.resolve();

    let metas: ModrinthProject[] = [];
    if (params.length === 0) return [];
    if (params.length === 1) metas = [await fetchModrinthFileMetadata(params[0].match.id)];
    if (params.length > 1)
      metas = await fetchModrinthFilesMetadata(params.map(({ match: { id } }) => id));

    metas.forEach(project => {
      if (!assoc.ids.includes(project.id)) {
        assoc.ids.push(project.id);
        assoc.projects.push(project);
      }

      projectAssociations.get(project.id).file = file.path;
    });

    return metas;
  });

  const projects = await Promise.all(projectsPromise);

  return {
    fileAssociations,
    projectAssociations,
    projects: Array.from(getUnique(projects.flat(), project => project.id)),
  };
};

export type ModrinthMetadata = InferPromiseType<ReturnType<typeof fetchAllModrinthMetadata>>;
