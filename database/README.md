# Database import guide

For a catalog with data, import **[import.sql](import.sql)**. `schema.sql` creates only the three tables, so an empty result after importing that file is expected.

| File | Result |
| --- | --- |
| `import.sql` | Three tables plus 16 retro catalog titles, fees, stock and local image URLs |
| `schema.sql` | Three empty tables; used by backend startup before environment-controlled seeding |

## MySQL Workbench or phpMyAdmin

1. Create a MySQL 8.4 database named `alive_rental` with `utf8mb4` encoding, or choose your existing project database.
2. Select that database as the default schema (Workbench: double-click the schema; phpMyAdmin: click the database).
3. Open/import **`database/import.sql`** and execute the whole file. In Workbench, execute the entire script, not only the current statement.
4. Refresh the tables and run:

```sql
SELECT COUNT(*) AS catalog_titles FROM media;
SELECT title, category, format, release_year, language, image_url FROM media;
```

A fresh import returns **16 catalog titles**: 8 music CDs and 8 movie DVDs. Importing again skips existing titles and preserves edited prices, stock, customers and rental history. The file also adds missing catalog metadata columns to older project tables. It does not drop tables or change the selected database.

`users` and `rentals` are intentionally empty in a fresh SQL import. Start the backend to create the admin from `ADMIN_EMAIL` / `ADMIN_PASSWORD`, then register a customer and make a rental through the app. No passwords or personal rental records are bundled in this SQL file.

## Docker

The easiest full application setup, from the backend folder:

```sh
docker compose up -d --build
```

With the default `SEED_SAMPLE_DATA=true`, a fresh database automatically receives the catalog and environment-configured admin. To import manually into the running database:

```sh
docker compose exec -T database sh -c 'exec mysql -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"' < database/import.sql
```

SQL stores image paths, not the image bytes. Keep `public/images/retro/` from this repository and run the backend to serve URLs such as `/images/retro/boomerang.png`. Set `DB_NAME` to the database you selected if you use a different name.

`import.sql` is the same ready-to-import catalog distributed in `retro-catalog/retro-catalog.sql`; release references are in `retro-catalog/SOURCES.md`.
