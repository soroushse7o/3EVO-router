import { Database } from "node:sqlite";
import { DATA_FILE } from "../paths.js";

export async function createNodeSqliteAdapter(filePath) {
  const db = new Database(filePath);
  await db.exec("PRAGMA journal_mode = WAL");
  return {
    driver: "node:sqlite",
    async run(sql, params) { return db.prepare(sql).run(params); },
    async get(sql, params) { return db.prepare(sql).get(params); },
    async all(sql, params) { return db.prepare(sql).all(params); },
    async close() { db.close(); },
  };
}
