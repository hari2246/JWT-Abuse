import { runSecurityChecks } from "./detectionEngine.js";
import { updateUserBaseline } from "./userBehavior.js";

export const processSecurityEvent = async (context) => {

  // 1️⃣ run detection rules
  await runSecurityChecks(context);

  // 2️⃣ update behavior baseline
  await updateUserBaseline(context.userId);

};