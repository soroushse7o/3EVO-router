import Database from "better-sqlite3";
import { DATA_FILE } from "../paths.js";

export function createBetterSqliteAdapter(filePath) {
  const db = new Database(filePath);
  db.pragma("journal_mode = WAL");
  return {
    driver: "better-sqlite3",
    run(sql, params) { return db.run(sql, params); },
    get(sql, params) { return db.get(sql, params); },
    all(sql, params) { return db.all(sql, params); },
    close() { db.close(); },
  };
}
