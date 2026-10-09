import { readFile } from "node:fs/promises";
import { pool } from "./database.js";

// Add optional metadata to existing installations without touching rentals.
export const metadataColumns = {
  catalog_key: "VARCHAR(64) NULL UNIQUE",
  original_title: "VARCHAR(150) NULL",
  release_year: "SMALLINT UNSIGNED NULL",
  language: "ENUM('Thai','English') NULL",
  genre: "VARCHAR(100) NULL",
  description: "VARCHAR(1000) NULL",
  featured_tracks: "VARCHAR(500) NULL",
  image_url: "VARCHAR(255) NULL",
};
export async function upgradeCatalogSchema() {
  const [columns] = await pool.query("SHOW COLUMNS FROM media");
  const existing = new Set(columns.map((column) => column.Field));
  for (const [name, definition] of Object.entries(metadataColumns)) {
    if (!existing.has(name))
      await pool.query(`ALTER TABLE media ADD COLUMN ${name} ${definition}`);
  }
}
export async function importRetroCatalog() {
  const catalog = JSON.parse(
    await readFile(
      new URL("../../retro-catalog/catalog.json", import.meta.url),
      "utf8",
    ),
  );
  const fields = [
    "catalog_key",
    "title",
    "creator",
    "category",
    "format",
    "total_copies",
    "daily_fee",
    "daily_late_fee",
    "original_title",
    "release_year",
    "language",
    "genre",
    "description",
    "featured_tracks",
    "image_url",
  ];
  const db = await pool.getConnection();
  let inserted = 0;
  try {
    await db.beginTransaction();
    for (const item of catalog.items) {
      // Re-imports preserve edited prices, stock, archive state and rental history.
      const [result] = await db.execute(
        `INSERT INTO media (${fields.join(",")}) SELECT ${fields.map(() => "?").join(",")} WHERE NOT EXISTS (SELECT 1 FROM media WHERE catalog_key=? OR (title=? AND creator=? AND format=?))`,
        [
          ...fields.map((field) => item[field] ?? null),
          item.catalog_key,
          item.title,
          item.creator,
          item.format,
        ],
      );
      inserted += result.affectedRows;
    }
    await db.commit();
    return { inserted, skipped: catalog.items.length - inserted };
  } catch (error) {
    await db.rollback();
    throw error;
  } finally {
    db.release();
  }
}
