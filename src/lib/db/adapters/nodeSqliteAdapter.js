import { Database } from "node:sqlite";
import { DATA_FILE } from "../paths.js";

export async function createNodeSqliteAdapter(filePath) {
  const db = new Database(filePath);
  await db.exec("PRAGMA journal_mode = WAL");
  return {
    driver: "node:sqlite",
    async run(sql, params) { return db.run(sql, params); },
    async get(sql, params) { return db.get(sql, params); },
    async all(sql, params) { return db.all(sql, params); },
    async close() { db.close(); },
  };
}
