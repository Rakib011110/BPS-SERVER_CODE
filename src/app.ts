import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import routes from "./routes";
import globalErrorHandler from "./app/middlewares/globalErrorHandler";
import notFound from "./app/middlewares/notFound";
import bodyParser from "body-parser";
import path from "path";
import { downloadCleanupJob } from "./app/utils/downloadCleanupJob";
import { startSubscriptionCron } from "./app/modules/Subscription/subscription.cron";
//

dotenv.config();

const app = express();

// CORS configuration to allow credentials
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'], // Add your frontend URLs
  credentials: true,
}));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use("/api", routes);

app.get("/", (req, res) => {
  res.send("Hello mongodb!");
});
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Start background jobs
downloadCleanupJob.startCleanupJob();
startSubscriptionCron();

app.use(globalErrorHandler as any);

app.use(notFound as any);

export default app;
