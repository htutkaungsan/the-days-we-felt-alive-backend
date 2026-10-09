import { initialize } from "../src/config/initialize.js";
import { importRetroCatalog } from "../src/config/retro-catalog.js";
import { pool } from "../src/config/database.js";
try {
  await initialize();
  console.log("Retro catalog:", await importRetroCatalog());
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
