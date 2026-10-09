import fs from "node:fs/promises";
import { metadataColumns } from "../src/config/retro-catalog.js";
const catalog = JSON.parse(
  await fs.readFile(new URL("catalog.json", import.meta.url), "utf8"),
);
const schema = await fs.readFile(
  new URL("../database/schema.sql", import.meta.url),
  "utf8",
);
const quote = (value) =>
  value == null
    ? "NULL"
    : typeof value === "number"
      ? String(value)
      : "'" +
        String(value).replaceAll("\\", "\\\\").replaceAll("'", "''") +
        "'";
let sql =
  "-- The Days We Felt Alive: 1990–2014 retro catalog\n-- Htut Kaung San / b67103023\n-- MySQL 8.4; select the target database before importing.\n-- Safe to repeat: preserves existing customers, rentals, prices and stock.\nSET NAMES utf8mb4;\n\n" +
  schema +
  "\n";
for (const [name, definition] of Object.entries(metadataColumns)) {
  sql += `SET @retro_ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='media' AND column_name='${name}')=0, ${quote(`ALTER TABLE media ADD COLUMN ${name} ${definition}`)}, 'SELECT 1');\nPREPARE retro_stmt FROM @retro_ddl;\nEXECUTE retro_stmt;\nDEALLOCATE PREPARE retro_stmt;\n`;
}
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
sql += "\nSTART TRANSACTION;\n";
for (const item of catalog.items) {
  sql += `\n-- ${item.title} (${item.release_year})\nINSERT INTO media (${fields.join(", ")})\nSELECT ${fields.map((field) => quote(item[field])).join(", ")}\nWHERE NOT EXISTS (SELECT 1 FROM media WHERE catalog_key=${quote(item.catalog_key)} OR (title=${quote(item.title)} AND creator=${quote(item.creator)} AND format=${quote(item.format)}));\n`;
}
sql += "\nCOMMIT;\n";
await fs.writeFile(new URL("retro-catalog.sql", import.meta.url), sql);
let credits =
  "# Retro catalog source credits\n\nResearched on 9 October 2026. Original release years are used; digital reissue dates may differ. Artwork rights remain with the respective rights holders. Thai images are AI-edited retro-frame variants; English images preserve the originals and use a matching frontend frame, and source images are kept in `public/images/retro/originals/`. Descriptions are original, and no lyrics or full media are distributed. Inventory and THB prices are demonstration values.\n\n";
for (const item of catalog.items) {
  credits += `## ${item.title} — ${item.release_year}\n\n${item.creator} · ${item.language} · ${item.category}\n\n`;
  for (const url of item.sources.metadata)
    credits += `- [Metadata / release source](${url})\n`;
  credits += `- [Artwork source](${item.sources.image})\n- Local image: \`${item.image_url}\`\n`;
  credits += `\nArtwork treatment: ${item.sources.artwork_treatment}\n`;
  if (item.sources.note) credits += `\n${item.sources.note}\n`;
  credits += "\n";
}
await fs.writeFile(new URL("SOURCES.md", import.meta.url), credits);
