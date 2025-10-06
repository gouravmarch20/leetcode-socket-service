const Redis = require("ioredis");
const ServerConfig = require("./serverConfig");

const redisConfig = {
  port: ServerConfig.REDIS_PORT,
  host: ServerConfig.REDIS_HOST,
  maxRetriesPerRequest: null, // prevent retry errors
};

const redisConnection = new Redis(redisConfig);

redisConnection.on("connect", () => {
  console.log("Connected to Redis successfully!");
});

redisConnection.on("error", (err) => {
  console.error("Redis connection error:", err);
});

module.exports = redisConnection;
