// userRoutes.js
import express from "express";
import { validateRequest } from "../middlewares/validateRequest.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";

import {
  listUsers,
  updateUserRole,
  editUserProfile,
  deleteUser,
} from "../controllers/userController.js";
import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 25 * 1024 * 1024 },
});

const router = express.Router();

router.get("/lists", protect, authorize("admin"), listUsers);

router.put("/role/:userID", protect, authorize("admin"), updateUserRole);

router.put("/edit/:userID", protect, authorize("admin"),upload.single("coverImage") ,editUserProfile);

router.delete("/delete/:userID", protect, authorize("admin"), deleteUser);

export default router;
