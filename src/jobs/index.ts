import cron from "node-cron";
import { fundUsersWithRoi } from "./helper/result-funding";
import { walletChecker } from "./helper/balance-updater";

cron.schedule("0 0,12 * * *", async () => {
  console.log(`[${new Date().toISOString()}] Running task every 3 hours`);

  try {
    // Your logic here
    await fundUsersWithRoi();
  } catch (error) {
    console.error("Cron task error:", error);
  }
});

cron.schedule(
  "0 */10 * * * *",
  async () => {
    try {
      await walletChecker();
      // console.log("walletChecker ran at", new Date().toISOString());npm run dev
    } catch (err) {
      console.error("walletChecker error:", err);
    }
  },
  {
    timezone: "Africa/Lagos",
  }
);
