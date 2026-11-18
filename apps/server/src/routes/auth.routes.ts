import { loginLimit } from "../middleware/login-limit.js";
import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  changeCurrentPassword,
} from "../controllers/auth.controller.js";
import { verifyJwt } from "../middleware/auth.js";
import { ensureDbConnected } from "../middleware/ensureDb.js";

export const authRouter = Router();

// Ensure DB is connected for database-dependent auth operations
authRouter.use(ensureDbConnected);

// Public routes
authRouter.route("/register").post(registerUser);
authRouter.route("/login").post(loginLimit, loginUser);
authRouter.route("/refresh").post(refreshAccessToken);
authRouter.route("/refresh-token").post(refreshAccessToken);

// Secured routes
authRouter.route("/logout").post(verifyJwt, logoutUser);
authRouter.route("/me").get(verifyJwt, getCurrentUser);
authRouter.route("/change-password").post(verifyJwt, changeCurrentPassword);
