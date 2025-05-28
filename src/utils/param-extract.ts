type ExtractPathParams<Path extends string> = Path extends `${string}:${infer Param}/${infer Rest}`
  ? { [K in Param | keyof ExtractPathParams<Rest>]: string }
  : Path extends `${string}:${infer Param}`
    ? { [K in Param]: string }
    : // biome-ignore lint/complexity/noBannedTypes: this really refers to an empty object
      {};

export type URLParams<Path extends string> = Omit<ExtractPathParams<Path>, "">;

type OkParsedURLParams<Path extends string> = {
  ok: true;
  match: URLParams<Path>;
};
type PartialParsedURLParams<Path extends string> = { ok: false; partial: Partial<URLParams<Path>> };

type ParsedURLParams<Path extends string> = OkParsedURLParams<Path> | PartialParsedURLParams<Path>;

export const urlParamExtractor =
  <Pattern extends string>(pattern: Pattern) =>
  (value: string): ParsedURLParams<Pattern> => {
    type Params = URLParams<Pattern>;

    const names: (keyof Params)[] = [];
    const regexPattern = pattern.replace(/:([^/]+)/g, (_, key: keyof Params) => {
      names.push(key);
      return "([^/]+)";
    });

    const regex = new RegExp(`^${regexPattern}$`);
    const match = value.match(regex);

    if (!match) return { ok: false, partial: {} };

    const params = {} as Params;
    names.forEach(<Key extends keyof Params>(name: Key, i: number) => {
      params[name] = match[i + 1] as Params[Key];
    });

    return { ok: true, match: params };
  };

export const filterOkParsedParams = <Path extends string>(
  match: ParsedURLParams<Path>,
): match is OkParsedURLParams<Path> => {
  if (!match.ok) console.warn("Unhandled impartial match", match);
  return match.ok;
};
