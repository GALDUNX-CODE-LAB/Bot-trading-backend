import mongoose, { Types } from "mongoose";
import TaskModel, { ITask } from "../../models/task-model";
import UserModel from "../../models/user-model";
import response from "../../utils/response-util";

class TaskService {
  async createTask(data: { title: string; pointReward: number; imageUrl: string; link: string }): Promise<ITask> {
    const { title, pointReward, imageUrl, link } = data;

    // Basic validation (optional here if validated in controller or with middleware)
    if (!title || pointReward <= 0) {
      throw new Error("Invalid task data");
    }

    const newTask = await TaskModel.create({ title, pointReward, imageUrl: "link", link });
    return newTask;
  }

  async completeTask(userId: Types.ObjectId, taskId: string) {
    const taskObjectId = new mongoose.Types.ObjectId(taskId);

    const user = await UserModel.findById(userId);
    const task = await TaskModel.findById(taskObjectId);

    if (!user) {
      throw new Error("User  not found");
    }
    if (!task) {
      throw new Error(" Task not found");
    }

    const alreadyCompleted = user.completedTask.includes(taskObjectId);
    if (alreadyCompleted) {
      throw new Error("Task already completed by user");
    }

    // Add task to completed list and update points
    user.completedTask.push(new mongoose.Types.ObjectId(taskId));
    user.coinBalance += task.pointReward;
    // user.availableBalance += task.pointReward;

    await user.save();
    return "Task completed and reward added";
    //  return { success: true, message: "Task completed", reward: task.pointReward };
  }

  async getCompletedAndUncompletedTasks(userId: string) {
    const user = await UserModel.findById(userId).populate("completedTask");

    if (!user) {
      throw new Error("User not found");
    }

    const allTasks = await TaskModel.find().lean();

    const completedTaskIds = user.completedTask.map((task) => task._id.toString());

    const completed = user.completedTask;
    const uncompleted = allTasks.filter((task) => !completedTaskIds.includes(task._id.toString()));

    return { completed, uncompleted };
  }
}

export default new TaskService();
