import { Axios, type AxiosResponse } from "axios";
import { config } from "../config";

export const modrinth = new Axios({
  baseURL: "https://api.modrinth.com/v2",
  headers: {
    Authorization: config.modrinthPat,
    Accept: "application/json",
    "Content-Type": "application/json",
    "User-Agent": config.userAgentPrefix,
  },
  responseType: "json",
  transformResponse: body => JSON.parse(body),
});

let remaining = Number.POSITIVE_INFINITY;
let resetTime = 0;
let queue: Promise<void> = Promise.resolve();

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

modrinth.interceptors.request.use(async req => {
  queue = queue.then(async () => {
    const now = Date.now();
    if (remaining <= 0 && now < resetTime) {
      const wait = resetTime - now;
      console.warn(`[Modrinth] Rate limit hit. Waiting ${wait}ms...`);
      await delay(wait);
    }
  });

  await queue;

  return req;
});

const setRateLimitData = (r: number, reset: number) => {
  if (!Number.isNaN(r)) remaining = r;
  if (!Number.isNaN(reset)) resetTime = reset;
};

const handleResponseHeaders = (res?: AxiosResponse) => {
  if (!res) return;
  const headers = res.headers;
  if (headers)
    setRateLimitData(
      Number.parseInt(headers["x-ratelimit-remaining"], 10),
      Number.parseInt(headers["x-ratelimit-reset"], 10) * 1000,
    );
};

modrinth.interceptors.response.use(
  response => {
    handleResponseHeaders(response);
    return response;
  },
  error => {
    handleResponseHeaders(error?.response);
    return Promise.reject(error);
  },
);
