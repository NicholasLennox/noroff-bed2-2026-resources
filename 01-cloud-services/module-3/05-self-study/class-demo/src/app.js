const express = require("express");

require("dotenv").config();

const app = express();

const ENVIRONMENT = process.env.ENVIRONMENT || "default";

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    environment: ENVIRONMENT,
  });
});

module.exports = app;
