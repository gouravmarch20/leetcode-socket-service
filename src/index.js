const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const bodyParser = require("body-parser");
const { PORT } = require("./config/serverConfig");
const redisCache = require("./config/redisConfig");

const app = express();

// ✅ Allow CORS from anywhere
app.use(cors({ origin: "*", methods: ["GET", "POST"], credentials: true }));

app.use(bodyParser.json());
// Log all incoming HTTP requests
app.use((req, res, next) => {
  console.log(`[HTTP] ${req.method} ${req.url} - from ${req.ip}`);
  next();
});

const httpServer = createServer(app);

// ✅ Allow all origins for Socket.IO too
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.get("/ping", (req, res) => {
  return res.json({ message: "Socket Service is alive__0" });
});
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("setUserId", (userId) => {
    console.log("Setting user id to connection id:", userId, socket.id);
    redisCache.set(userId, socket.id);
  });

  socket.on("getConnectionId", async (userId) => {
    try {
      const connId = await redisCache.get(userId);
      console.log("Getting connection id for user id:", userId, connId);
      socket.emit("connectionId", connId);
    } catch (err) {
      console.error("Error fetching from Redis:", err);
    }
  });
});

app.post("/sendPayload", async (req, res) => {
  const { userId, payload } = req.body;
  console.log("to_Send", userId, payload);

  if (!userId || !payload) {
    return res.status(400).send("Invalid request");
  }

  try {
    const socketId = await redisCache.get(userId);

    if (socketId) {
      io.to(socketId).emit("submissionPayloadResponse", payload);
      return res.send("Payload sent successfully");
    } else {
      return res.status(404).send("User not connected");
    }
  } catch (err) {
    console.error("Redis error:", err);
    return res.status(500).send("Internal server error");
  }
});

httpServer.listen(PORT, () => {
  console.log("Server is running on port", PORT);
});
