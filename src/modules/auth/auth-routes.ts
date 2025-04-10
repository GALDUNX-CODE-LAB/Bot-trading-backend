// src/routes/auth.routes.ts
import { Router } from "express";
import { AuthController } from "./auth-controller";
import authHandler from "../../middleware/auth-handler";

const authRoute = Router();

authRoute.post("/auth/telegram", AuthController.telegramLogin);
authRoute.get("/check-user/:telegramId", AuthController.checkUserExists);

authRoute.use(authHandler);
authRoute.post("/users/claim-mining", AuthController.claimMiningPoints);
authRoute.post("/invite", AuthController.inviteUser)
authRoute.post("/users/transfer", AuthController.transferFunds)
authRoute.get("/user", AuthController.getUserById);
authRoute.get("/users/stats", AuthController.getUserStats);
authRoute.get("/completed", AuthController.getCompletedTasks);

// abcd
export default authRoute;
