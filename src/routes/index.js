import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { pool } from "../config/database.js";
import { authenticate, optionalAuth, role } from "../middleware/auth.js";
import * as auth from "../controllers/auth.js";
import * as media from "../controllers/media.js";
import * as customers from "../controllers/customers.js";
import * as rentals from "../controllers/rentals.js";
export const router = Router();
router.get("/health", async (req, res) => {
  await pool.query("SELECT 1");
  res.json({ data: { status: "ok" } });
});
const authLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: { message: "Too many attempts. Try again later" } },
});
router.post("/auth/register", authLimit, auth.register);
router.post("/auth/login", authLimit, auth.login);
router.get("/auth/me", authenticate, auth.me);
router.get("/media", optionalAuth, media.list);
router.get("/media/:id", optionalAuth, media.get);
router.post("/media", authenticate, role("admin"), media.create);
router.patch("/media/:id", authenticate, role("admin"), media.update);
router.delete("/media/:id", authenticate, role("admin"), media.remove);
router.use("/customers", authenticate, role("admin"));
router.get("/customers", customers.list);
router.get("/customers/:id", customers.get);
router.post("/customers", customers.create);
router.patch("/customers/:id", customers.update);
router.delete("/customers/:id", customers.remove);
router.use("/rentals", authenticate);
router.get("/rentals", rentals.list);
router.get("/rentals/:id", rentals.get);
router.post("/rentals", role("customer"), rentals.create);
router.patch("/rentals/:id", role("admin"), rentals.update);
