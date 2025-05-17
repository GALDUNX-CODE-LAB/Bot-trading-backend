import ResultModel from "../../models/result-model";
import roiModel from "../../models/roi-model";
import UserModel from "../../models/user-model";

// 2% ROI funding function
export const fundUsersWithRoi = async () => {
  try {
    const users = await UserModel.find();

    await Promise.all(
      users.map(async (user) => {
        if (!user.botActive) return;
        const id = "67f578e18619babaf8a9ed34";
        const roi = await roiModel.findById(id);
        const percentage = roi?.percentageAmount ? roi.percentageAmount / 100 : 0.02;

        const roiAmount = parseFloat((user.operatingBalance * percentage).toFixed(2));

        if (roiAmount <= 0) return;

        user.availableBalance += roiAmount;
        user.coinBalance += roiAmount;
        await user.save();

        await ResultModel.create({
          userId: user._id,
          taskId: generateAICode(),
          date: new Date(),
          amount: roiAmount,
          roiPercentage: percentage,
        });
      })
    );

    console.log("ROI funding complete for all users.");
  } catch (error) {
    console.error("Error funding users with ROI:", error);
  }
};

export const generateAICode = (): string => {
  const randomNum = Math.floor(10000 + Math.random() * 90000); // ensures 5 digits
  return `AI-${randomNum}`;
};
