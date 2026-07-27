const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const helmet = require("helmet");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const promClient = require("prom-client");

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

// ── Prometheus Metrics ──
const collectDefaultMetrics = promClient.collectDefaultMetrics;
collectDefaultMetrics({ prefix: "myapp_" });
const httpRequestCounter = new promClient.Counter({
  name: "myapp_http_requests_total",
  help: "Total HTTP requests",
  labelNames: ["method", "route", "status"],
});
const httpRequestDuration = new promClient.Histogram({
  name: "myapp_http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route"],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 5],
});
const activeConnections = new promClient.Gauge({
  name: "myapp_active_connections",
  help: "Active connections",
});

// ── Security ──
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ── Rate Limiting ──
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, try again later" },
});
app.use("/api/", limiter);

// ── Structured Logging ──
morgan.token("body", (req) => JSON.stringify(req.body));
app.use(
  morgan(
    ':remote-addr - :remote-user [:date[iso]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"',
    {
      skip: (req) => req.url === "/api/health" || req.url === "/metrics",
    }
  )
);

// ── Metrics Middleware ──
app.use((req, res, next) => {
  if (req.url === "/metrics") return next();
  const end = httpRequestDuration.startTimer();
  activeConnections.inc();
  res.on("finish", () => {
    httpRequestCounter.inc({ method: req.method, route: req.route?.path || req.path, status: res.statusCode });
    end({ method: req.method, route: req.route?.path || req.path });
    activeConnections.dec();
  });
  next();
});

// ── Swagger Docs ──
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: { title: "my-node-app API", version: "1.0.0", description: "Solo Operator API" },
    servers: [{ url: `http://localhost:${PORT}` }],
  },
  apis: [__filename],
});
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
app.get("/api/openapi.json", (req, res) => res.json(swaggerSpec));

// ── Routes ──

/**
 * @openapi
 * /:
 *   get:
 *     summary: Root endpoint
 *     responses:
 *       200:
 *         description: API info
 */
app.get("/", (req, res) => {
  res.json({ message: "Hello from Node.js!", env: NODE_ENV, version: "2.0.0" });
});

/**
 * @openapi
 * /api/health:
 *   get:
 *     summary: Health check
 *     responses:
 *       200:
 *         description: System health
 */
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    memory: process.memoryUsage(),
    env: NODE_ENV,
  });
});

/**
 * @openapi
 * /api/info:
 *   get:
 *     summary: System info
 *     responses:
 *       200:
 *         description: System information
 */
app.get("/api/info", (req, res) => {
  res.json({
    name: "my-node-app",
    version: "2.0.0",
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpus: require("os").cpus().length,
  });
});

/**
 * @openapi
 * /api/users:
 *   get:
 *     summary: List users
 *     responses:
 *       200:
 *         description: User list
 */
const users = [
  { id: 1, name: "Alice Johnson", email: "alice@example.com", role: "admin" },
  { id: 2, name: "Bob Smith", email: "bob@example.com", role: "user" },
  { id: 3, name: "Charlie Brown", email: "charlie@example.com", role: "user" },
];

app.get("/api/users", (req, res) => {
  res.json({ count: users.length, data: users });
});

app.get("/api/users/:id", (req, res) => {
  const user = users.find((u) => u.id === parseInt(req.params.id));
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

// ── Metrics Endpoint ──
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", promClient.register.contentType);
  res.end(await promClient.register.metrics());
});

// ── 404 Handler ──
app.use((req, res) => {
  res.status(404).json({ error: "Not found", path: req.path });
});

// ── Error Handler ──
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`);
  res.status(500).json({ error: "Internal server error", message: NODE_ENV === "development" ? err.message : undefined });
});

module.exports = app;

// ── Start ──
if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`my-node-app v2.0.0 running on http://localhost:${PORT}`);
    console.log(`  API Docs:    http://localhost:${PORT}/api/docs`);
    console.log(`  Metrics:     http://localhost:${PORT}/metrics`);
    console.log(`  Health:      http://localhost:${PORT}/api/health`);
    console.log(`  Environment: ${NODE_ENV}`);
  });
  process.on("SIGINT", () => { console.log("Shutting down..."); server.close(); process.exit(0); });
  process.on("SIGTERM", () => { console.log("Shutting down..."); server.close(); process.exit(0); });
}
