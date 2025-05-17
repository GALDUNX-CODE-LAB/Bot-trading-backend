import { Router } from "express";
import { ResultController } from "./result-controller";

const ResultRoute = Router();

ResultRoute.get("/results", ResultController.getAllResults);
ResultRoute.get("/result/stats", ResultController.getUserTradeStats);
ResultRoute.get("/result/user", ResultController.getUserResults);
ResultRoute.put("/result/bot/:toggle", ResultController.toggleBot);

export default ResultRoute;
