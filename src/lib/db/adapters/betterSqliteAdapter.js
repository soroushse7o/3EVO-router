import Database from "better-sqlite3";
import { DATA_FILE } from "../paths.js";

export function createBetterSqliteAdapter(filePath) {
  const db = new Database(filePath);
  db.pragma("journal_mode = WAL");
  return {
    driver: "better-sqlite3",
    run(sql, params) { return db.prepare(sql).run(params); },
    get(sql, params) { return db.prepare(sql).get(params); },
    all(sql, params) { return db.prepare(sql).all(params); },
    close() { db.close(); },
  };
}
