import express from "express";
import cors from "cors";

import routes from "./routes.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check (Cloud Run friendly)
app.get("/healthz", (_req, res) => res.status(200).send("ok"));

// Routes
app.use("/", routes);

// IMPORTANT: Cloud Run provides PORT env var. Must listen on it.
const PORT = Number(process.env.PORT || 8080);

// IMPORTANT: bind to 0.0.0.0 in containers
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server listening on port ${PORT}`);
});

// Helpful crash logging (so Cloud Run logs show the real reason)
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});
