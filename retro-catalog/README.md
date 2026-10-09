# The Days We Felt Alive — 1990–2014 Retro Catalog

Prepared for Htut Kaung San, b67103023. Sixteen familiar releases: four Thai albums, four English albums, four Thai films and four English films. Music records represent complete CDs; selected famous songs appear as track highlights. Movie records represent rental DVDs. Original release year is separate from the shop's disc format; this is not a physical edition database.

## Files

- `retro-catalog.sql`: ready-to-import MySQL database file. Creates the project's three tables if needed, upgrades older media tables and inserts 16 titles.
- `catalog.json`: readable dataset, including source links, image credits and edition notes.
- `SOURCES.md`: release-year and artwork references.
- `import.mjs`: application importer; repeat runs preserve existing records, fees, stock and rental history.
- `build-sql.mjs`: regenerates SQL and source credits from the JSON dataset.
- `../public/images/retro/`: catalog covers/posters; `originals/` retains the source artwork.

All stock and rental prices are fictional shop data (three copies per title; music 15 THB/day, film 25 THB/day). No songs, films or lyrics are bundled. Album covers and promotional posters remain the property of their rights holders.

## Import into the running backend

From the backend folder:

```sh
docker compose up -d --build
docker compose exec -T express-api npm run seed:retro
```

A fresh database is seeded automatically when `SEED_SAMPLE_DATA=true`. Existing databases gain the metadata columns at startup; importing the catalog does not reset customer or rental records. Titles already present by catalog key or matching title/creator/format are skipped, so edits made by the administrator survive re-import.

Alternatively, import the database file directly (choose one importer):

```sh
docker compose exec -T database sh -c 'exec mysql -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"' < retro-catalog/retro-catalog.sql
```

For a standalone MySQL installation, select/create a database using UTF-8 (`utf8mb4`) and import `retro-catalog.sql`. The SQL does not create an administrator account; start the backend afterwards to create the environment-configured admin. It contains no credentials.

## Images and frontend

Database values are local paths such as `/images/retro/boomerang.png` or `/images/retro/adele-21.jpg`. Express serves the files from `backend/public/images/retro/`; the Angular development proxy and frontend Nginx forward `/images/` to the backend. Artwork therefore loads from the same frontend origin, without remote hotlinks. The frontend keeps the whole cover visible, labels the release year/language and shows Thai original titles.

Thai images are AI-edited retro-frame variants, not archival reproductions. The image editor rejected the English artwork edits, so those files retain the original artwork and use a matching CSS frame. CSS uses `object-fit: contain` to show the complete composition without cropping. Original source images are retained for comparison.

## Release dates

Modern Dog's debut was released in 1994; its Apple Music edition is dated 2012. Oasis uses artwork from a remastered edition while its original album year remains 1995. LO-Society is a LOSO band album although Apple Music lists Sek Loso. See the source ledger for these distinctions.
