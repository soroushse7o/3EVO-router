import initSqlJs from "sql.js";
import { DATA_FILE } from "../paths.js";

let SQL = null;
async function getSqlJs() {
  if (!SQL) SQL = await initSqlJs();
  return SQL;
}

export async function createSqlJsAdapter(filePath) {
  const SQL = await getSqlJs();
  const fs = await import("node:fs");
  let db;
  try {
    const buf = fs.readFileSync(filePath);
    db = new SQL.Database(buf);
  } catch {
    db = new SQL.Database();
  }
  db.run("PRAGMA journal_mode=WAL");
  return {
    driver: "sql.js",
    run(sql, params) { db.run(sql, params); },
    get(sql, params) { return db.exec(sql, params)?.[0]?.values?.[0] ?? null; },
    all(sql, params) {
      const stmt = db.prepare(sql);
      if (params?.length) stmt.bind(params);
      const rows = [];
      while (stmt.step()) rows.push(stmt.getAsObject());
      stmt.free();
      return rows;
    },
    close() { db.close(); },
  };
}
