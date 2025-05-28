import { Console } from "node:console";
import { Transform } from "node:stream";

const ts = new Transform({
  transform(chunk, enc, cb) {
    cb(null, chunk);
  },
});

const logger = new Console({ stdout: ts });

export const tableString = (tabularData?: any, properties?: string[]): string => {
  logger.table(tabularData, properties);
  return (ts.read() || "").toString();
};
