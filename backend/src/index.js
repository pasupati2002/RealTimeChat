import express from "express";
import cors from "cors";

import "dotenv/config";

import fs from "fs";
import path from "path";

import { clerkMiddleware } from "@clerk/express";

import User from "./models/user.model.js";
import { connectDB } from "./lib/db.js";
import job from "./lib/cron.js";

import clerkWebhook from "./webhooks/clerk.webhook.js";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import { app, server } from "./lib/socket.js";

const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL;

const publicDir = path.join(process.cwd(), "public");

// Build the list of allowed origins.
// FRONTEND_URL can hold one or more comma-separated URLs in your .env,
// e.g. FRONTEND_URL=https://real-time-chat-navy.vercel.app,http://localhost:5173
// Trim trailing slashes so origin comparisons match what browsers actually send.
const allowedOrigins = [
  ...(FRONTEND_URL
    ? FRONTEND_URL.split(",").map((url) => url.trim().replace(/\/$/, ""))
    : []),
  "http://localhost:5173", // always allow local dev
];

// CORS configuration
app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (curl, Postman, server-to-server, mobile apps)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Not allowed by CORS: ${origin}`));
      }
    },
    credentials: true,
  })
);

// Clerk webhook must receive raw body — must be registered BEFORE express.json()
app.use(
  "/api/webhooks/clerk",
  express.raw({ type: "application/json" }),
  clerkWebhook
);

app.use(express.json());

app.use(clerkMiddleware());

app.get("/", (req, res) => {
  res.send("Backend is running!");
});

app.get("/health", (req, res) => {
  res.status(200).json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// Serve frontend build if public directory exists
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));

  app.get("/{*any}", (req, res, next) => {
    res.sendFile(path.join(publicDir, "index.html"), (err) => next(err));
  });
}

server.listen(PORT, () => {
  connectDB();

  console.log("Server is up and running on PORT:", PORT);
  console.log("Allowed origins:", allowedOrigins);

  if (process.env.NODE_ENV === "production") {
    job.start();
  }
});