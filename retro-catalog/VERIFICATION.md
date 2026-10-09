# Retro catalog verification — 9 October 2026

- Dataset: 16 unique releases, original years 1990–2014; four titles per Thai/English × music/movie group. Music rows are albums with track highlights.
- SQL file imported into a new disposable MySQL 8.4 database twice: exactly 16 media records, no duplicate titles.
- SQL file imported into the previous three-table schema: metadata columns added and 16 records inserted successfully.
- Fresh application initialization repeated: 16 media records and one seeded admin; no duplicates.
- Application upgrade from the previous schema: the old media record and its stock/fee values survived alongside the new catalog.
- Backend unit tests passed (3). Angular validator tests passed (4); production build passed with the existing 500 KB initial-bundle warning (about 618 KB, below the 1 MB error limit).

The completed runtime and browser checks are recorded below.

## Completed checks

- Backend integration suite: 7/7 passed, including repeated imports, preservation of admin fee/stock edits, original Thai title search, invalid metadata/path rejection, all 16 static image routes and existing auth/CRUD/rental/concurrency/return regressions.
- Both Docker images built and the local services restarted successfully.
- Live importer: first run inserted 16; repeated run inserted 0 and skipped 16.
- Local demo database retains its three accounts and three returned rentals. Six original fictional sample titles are archived (reversible through admin PATCH); 16 retro titles are visible. The import file itself does not archive or delete existing data.
- Every one of the 16 image paths returned an image response through both localhost:3017 (Express) and localhost:4200 (frontend proxy). No external image hotlinks are used by the catalog.
- Chrome: Thai artwork and original-title metadata render correctly. English album and movie filters display the matching local artwork. Mobile check at 390 × 844 showed readable cards and no horizontal overflow; the viewport override was reset.
- Screenshots: `../docs/retro-catalog-desktop.png` and `../docs/retro-catalog-mobile.png` (also copied into the frontend docs).

## Artwork treatment

Eight Thai artworks are AI-edited retro-frame variants. The image editor's safety system rejected the English edits, so the eight English source images are preserved and displayed with a matching CSS frame. Original source artwork is retained for comparison. The source ledger records these distinctions; these are catalog display assets, not archival reproductions or full films/music.
