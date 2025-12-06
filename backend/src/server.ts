import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { env } from "./config/env";
import authRoutes from "./routes/authRoutes";
import incidentsRoutes from "./routes/incidentsRoutes";
import leaderboardRoutes from "./routes/leaderboardRoutes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: env.clientOrigin,
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Attach io to app locals so controllers could emit if needed
app.locals.io = io;

app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Static file serving for uploads
app.use(
  "/uploads",
  express.static(path.resolve(process.cwd(), env.uploadsDir), {
    maxAge: "7d"
  })
);

app.get("/", (_req, res) => {
  res.send("GangaGuard API is running");
});

app.use("/api/auth", authRoutes);
app.use("/api/incidents", incidentsRoutes);
app.use("/api/leaderboard", leaderboardRoutes);

app.use(errorHandler);

const start = async () => {
  try {
    await mongoose.connect(env.mongoUri);
    console.log("Connected to MongoDB");
    server.listen(env.port, () => {
      console.log(`Server listening on port ${env.port}`);
    });
  } catch (err) {
    console.error("Failed to start server", err);
    process.exit(1);
  }
};

start();


