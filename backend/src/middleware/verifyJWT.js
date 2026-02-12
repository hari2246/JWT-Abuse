import jwt from "jsonwebtoken";
import crypto from "crypto";
import RevokedToken from "../models/RevokedToken.js";

export const verifyJWT = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;

    if (!auth || !auth.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = auth.split(" ")[1];

    // verify signature + expiry
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // hash token for blacklist checking
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const revoked = await RevokedToken.findOne({ tokenHash });
    if (revoked) {
      return res.status(401).json({ message: "Token revoked. Please login again." });
    }

    req.user = decoded;
    req.token = token;
    req.tokenHash = tokenHash;

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
