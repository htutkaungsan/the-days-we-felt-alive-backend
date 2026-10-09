import express from "express";
import { fileURLToPath } from "node:url";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";
import { router } from "./routes/index.js";
import { errorHandler } from "./utils/errors.js";
export const app = express();
app.disable("x-powered-by");
app.set("trust proxy", env.trustProxy);
app.use(helmet());
app.use(cors({ origin: env.corsOrigin }));
app.use(express.json({ limit: "16kb" }));
app.use(
  "/images",
  express.static(fileURLToPath(new URL("../public/images", import.meta.url)), {
    maxAge: "1d",
    dotfiles: "deny",
    index: false,
  }),
);
app.use("/api/v1", router);
app.use((req, res) =>
  res.status(404).json({ error: { message: "Endpoint not found" } }),
);
app.use(errorHandler);
