const path = require("path");
const express = require("express");
const session = require("express-session");
const apiRoutes = require("./routes");

function createApp() {
  const app = express();

  app.use(express.json({ limit: "8mb" }));
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "careconnect-dev-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: "lax"
      }
    })
  );

  app.use(express.static(path.resolve(__dirname, "..")));

  app.use((error, req, res, next) => {
    if (error instanceof SyntaxError && "body" in error) {
      res.status(400).json({ error: "Invalid JSON in request body." });
      return;
    }
    next(error);
  });

  app.use("/api", apiRoutes);

  return app;
}

module.exports = {
  createApp
};
