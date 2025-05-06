import { Request, Response } from "express";
import TaskService from "./task-service";
import response, { devResponse, errorResponse } from "../../utils/response-util";
import roiModel from "../../models/roi-model";

export class TaskController {
  static async createTask(req: Request, res: Response) {
    try {
      const { title, pointReward, imageUrl, link } = req.body;
      console.log(req.body);

      if (!title || !pointReward || pointReward <= 0) {
        return errorResponse(res, "Invalid request");
      }

      const task = await TaskService.createTask({ title, pointReward, imageUrl: imageUrl ?? "", link });
      return response(res, 200, task);
    } catch (error) {
      console.error("Error creating task:", error);
      return errorResponse(res, "Failed to create task");
    }
  }
  static async completeTask(req: Request, res: Response) {
    try {
      const userId = req.session.userId;
      const taskId = req.params.taskId;

      const result = await TaskService.completeTask(userId as any, taskId);
      return devResponse(res, result);
    } catch (error) {
      console.error("Task completion failed:", error);
      return errorResponse(res, "Failed to complete task");
    }
  }

  static async getUserTasks(req: Request, res: Response) {
    try {
      const userId = req.session.userId;

      const tasks = await TaskService.getCompletedAndUncompletedTasks(userId);

      return response(res, 200, tasks);
    } catch (error) {
      console.error("Failed to get user tasks:", error);
      return errorResponse(res, "Failed to retrieve user tasks");
    }
  }

  static getImageLink = async (req: Request, res: Response) => {
    try {
      const id = "67f578e18619babaf8a9ed34";
      const roi = await roiModel.findById(id);
      return response(res, 200, roi?.imageLink);
    } catch (error) {
      return errorResponse(res, "Failed to update Image Link");
    }
  };
}
