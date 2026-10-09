import { readFile } from "node:fs/promises";
import bcrypt from "bcryptjs";
import { pool } from "./database.js";
import { upgradeCatalogSchema, importRetroCatalog } from "./retro-catalog.js";
export async function initialize() {
  const schema = await readFile(
    new URL("../../database/schema.sql", import.meta.url),
    "utf8",
  );
  for (const statement of schema.split(";").filter((s) => s.trim()))
    await pool.query(statement);
  await upgradeCatalogSchema();
  const email = (process.env.ADMIN_EMAIL || "admin@example.com")
    .trim()
    .toLowerCase();
  const [existing] = await pool.execute(
    "SELECT id FROM users WHERE email = ?",
    [email],
  );
  if (!existing.length) {
    await pool.execute(
      "INSERT INTO users (name,email,password_hash,role) VALUES (?,?,?,?)",
      [
        process.env.ADMIN_NAME || "Shop Admin",
        email,
        await bcrypt.hash(process.env.ADMIN_PASSWORD, 12),
        "admin",
      ],
    );
  }
  const [[{ count }]] = await pool.query("SELECT COUNT(*) AS count FROM media");
  if (count === 0 && process.env.SEED_SAMPLE_DATA === "true") {
    await importRetroCatalog();
  }
}
