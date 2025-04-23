// src/routes/auth.routes.ts
import { Request, Response, Router } from "express";
import { AuthController } from "./auth-controller";
import authHandler from "../../middleware/auth-handler";
import secret from "../../config/secret-config";
import bot from "../../bot/config/bot";

const authRoute = Router();
const webhookPath = `/bot${secret.TELEGRAM_BOT_TOKEN}`;

authRoute.post("/auth/telegram", AuthController.telegramLogin);
authRoute.post("/auth/admin", AuthController.adminLogin);
authRoute.get("/check-user/:telegramId", AuthController.checkUserExists);
authRoute.get("/bot/roi", AuthController.roiInvest);
authRoute.post(webhookPath, (req: Request, res: Response) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

authRoute.use(authHandler);
authRoute.post("/users/claim-mining", AuthController.claimMiningPoints);
authRoute.get("/user", AuthController.getUserById);
authRoute.get("/users/stats", AuthController.getUserStats);
authRoute.get("/completed", AuthController.getCompletedTasks);
authRoute.post("/ping", AuthController.ping);

export default authRoute;
