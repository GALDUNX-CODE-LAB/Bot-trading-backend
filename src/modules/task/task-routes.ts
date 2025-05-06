import { Router } from "express";
import { TaskController } from "./task-controller";
import authHandler from "../../middleware/auth-handler";

const taskRoute = Router();

taskRoute.post("/tasks/new", TaskController.createTask);

taskRoute.use(authHandler);
taskRoute.post("/complete-task/:taskId", TaskController.completeTask);
taskRoute.get("/user/tasks", TaskController.getUserTasks);
taskRoute.get("/user/imagelink", TaskController.getImageLink);

export default taskRoute;
