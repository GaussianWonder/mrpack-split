export type InferPromiseType<T extends Promise<any>> = T extends Promise<infer U> ? U : never;
