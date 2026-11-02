export async function createBunSqliteAdapter(filePath) {
  const { Database } = await import("bun:sqlite");
  const db = new Database(filePath);
  db.run("PRAGMA journal_mode=WAL");
  return {
    driver: "bun:sqlite",
    run(sql, params) { return db.run(sql, params); },
    get(sql, params) { return db.get(sql, params); },
    all(sql, params) { return db.all(sql, params); },
    close() { db.close(); },
  };
}
