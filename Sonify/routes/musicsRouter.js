// In: ../routes/musicsRouter.js
import express from "express";
import multer from "multer";

import { validateRequest } from "../middlewares/validateRequest.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import {
  uploadMusic,
  streamMusicById,
  getMusicById,
  updateMusic,
  deleteMusic,
  searchMusic, 
  listNewMusic,
  listArtistMusic,
  ListMusic,
  changeMusicDetailManager,
} from "../controllers/musicController.js";
import { searchMusicValidation } from "../validators/musicValidators.js"; 

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
});

// --- Music Routes ---
// API get music stream by ID
router.get("/stream/:musicId", protect, streamMusicById);
// API upload music
router.post(
  "/upload",
  protect,
  authorize("admin", "artist"),
  upload.fields([
    { name: "audioFile", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  uploadMusic
);

// API get all music (lists new music)
router.get("/list", listNewMusic);
router.get("/list-music",protect,authorize("admin"),ListMusic)
router.get("/list-music-user",protect,authorize("admin", "artist"),listArtistMusic)

router.get(
    "/search",
    searchMusicValidation, 
    validateRequest,
    searchMusic 
);

// API edit music
router.put(
    "/update/:id",
    protect,
    authorize("admin", "artist"),
    updateMusic
);
router.put(
  "/change-detail",
  protect,
  authorize("admin","artist"),
  changeMusicDetailManager
)
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