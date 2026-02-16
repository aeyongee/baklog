#!/usr/bin/env node
import { createServer } from "http";
import { parse } from "url";
import next from "next";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const dev = process.env.NODE_ENV !== "production";

const app = next({
  dev,
  dir: dev ? process.cwd() : path.join(__dirname, ".."),
  conf: { distDir: ".next" },
});

const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error handling request:", err);
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
  }).listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Next.js ready on http://localhost:${PORT}`);
  });
});
