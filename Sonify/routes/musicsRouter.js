import express from "express";
import multer from "multer"; // Import multer itself

import { validateRequest } from "../middlewares/validateRequest.js"; 
import { protect, authorize } from "../middlewares/authMiddleware.js"; // Removed onlyArtist as authorize handles roles
import {
  uploadMusic,
  streamMusicById,
  getMusicById,
  updateMusic,
  deleteMusic,
  searchMusic,
  listNewMusic,
} from "../controllers/musicController.js";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 25 * 1024 * 1024 },
});

// --- Music Routes ---
// API get music stream by ID
router.get("/stream/:musicId", protect, streamMusicById);

// API upload music
router.post(
  "/upload",
  protect,
  authorize("admin", "artist"),
  upload.single("audioFile"),
  uploadMusic
);

// API get all music
router.get("/list", listNewMusic);

//  search (using query params)
router.get("/search", searchMusic);

// API edit music
router.put("/update/:id", protect, authorize("admin", "artist"), updateMusic);

// API delete music
router.delete(
  "/delete/:id",
  protect,
  authorize("admin", "artist"),
  deleteMusic
);


// API get music detail by ID this API does not require authentication
router.get("/:id", getMusicById);


export default router;
