import RequestLog from "../models/RequestLog.js";
import Alert from "../models/Alert.js";

export const getAlertStats = async (req, res) => {
  const alerts = await Alert.aggregate([
    {
      $group: {
        _id: "$type",
        count: { $sum: 1 }
      }
    }
  ]);

  res.json({ alerts });
};

export const getRequestStats = async (req, res) => {
  const requests = await RequestLog.aggregate([
    {
      $group: {
        _id: "$method",
        count: { $sum: 1 }
      }
    }
  ]);

  res.json({ requests });
};
