// userRoutes.js
import express from "express";
import { validateRequest } from "../middlewares/validateRequest.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";

import {
    listUsers,
    updateUserRole,
    editUserProfile,
    deleteUser
} from "../controllers/userController.js";


const router = express.Router();

router.get("/lists",
    protect,
    authorize("admin"),
    listUsers 
);

router.put("/role/:userID",
    protect,
    authorize("admin"),
    updateUserRole 
);

router.put("/edit/:userID",
    protect,
    authorize("admin"),
    editUserProfile 
);

router.delete("/delete/:userID",
    protect,
    authorize("admin"),
    deleteUser 
);

export default router;