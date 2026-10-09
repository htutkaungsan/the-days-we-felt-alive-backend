import { app } from "./app.js";
import { env, validateEnv } from "./config/env.js";
import { initialize } from "./config/initialize.js";
import { pool } from "./config/database.js";
validateEnv();
await initialize();
const server = app.listen(env.port, () =>
  console.log(`Alive API listening on port ${env.port}`),
);
function shutdown() {
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
