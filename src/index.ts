import express, { Request, Response } from "express";
import cors from "cors";
import morgan from "morgan"; // Import Morgan
import appRouter from "./routes";
import { configDotenv } from "dotenv";
import secret from "./config/secret-config";
import "./config/db-config"; // Import database connection
import errorHandler from "./middleware/error-handler";
import cron from "node-cron";
import { generateRandomSignal } from "./modules/signal/signal-generator";

import "./jobs";
import "./bot";
import bot from "./bot/config/bot";
// Load environment variables
configDotenv();

const app = express();

// Use middlewares
app.use(express.json());
app.use(
  cors({
    origin: secret.ORIGIN,
    credentials: true,
  })
);
// Morgan middleware to log HTTP requests
if (secret.NODE_ENV === "development") {
  app.use(morgan("dev")); // Logs concise colored output for development
} else {
  app.use(morgan("combined")); // Standard Apache combined log output for production
}

app.use(appRouter);
app.use(errorHandler);

const port = process.env.PORT || 5000;

const start = async () => {
  console.log("Connecting to database...");
  app.listen(port, () => {
    const appMessage =
      secret.NODE_ENV === "development" ? `Trading-Bot Server is running on http://127.0.0.1:${port}` : "App is live!";

    console.log(appMessage);
  });
};

// test auto deploy -- v5
// Run every 24 hours (at midnight)
cron.schedule("0 */6 * * *", async () => {
  console.log("⏰ Generating signal every 6 hours...");
  await generateRandomSignal();
});

start();
