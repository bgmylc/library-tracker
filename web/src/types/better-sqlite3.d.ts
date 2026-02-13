declare module "better-sqlite3" {
  export interface RunResult {
    changes: number;
    lastInsertRowid: number | bigint;
  }

  export interface Statement {
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
    run(...params: unknown[]): RunResult;
  }

  export default class Database {
    constructor(filename: string, options?: Record<string, unknown>);
    pragma(source: string): unknown;
    prepare(source: string): Statement;
  }
}
