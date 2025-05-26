import UserLikedItem from "../models/userLikedItem.model.js"
import LikeTracking from "../models/likeTracking.model.js";
import { validateItemExists, updateLikeCount} from "../utils/itemUtils.js";
import { sendError, sendSuccess } from "../utils/responseUtils.js";

export const toggleLike = async (req, res, next) => {
    const { item_id, item_type } = req.body;
    const user_id = req.user._id;

    try {
        const itemValidation = await validateItemExists(item_id, item_type); // You might need a more specific validator for "likeable" items
        if (!itemValidation.exists) {
            return sendError(res, 404, itemValidation.message || `${item_type} not found or has been removed.`);
        }

        const existingLike = await UserLikedItem.findOne({ user_id, item_id, item_type });

        let message;
        let liked;

        if (existingLike) {
            // Item is currently liked, so unlike it
            await UserLikedItem.deleteOne({ _id: existingLike._id });
            await updateLikeCount(item_id, item_type, false); // Decrement like_count
            message = 'Item unliked successfully.';
            liked = false;
        } else {
            const newLike = new UserLikedItem({
                user_id,
                item_id,
                item_type,
            });
            await newLike.save();
            await updateLikeCount(item_id, item_type, true); 
            message = 'Item liked successfully.';
            liked = true;
        }

        sendSuccess(res, 200, { liked, item_id, item_type }, message);

    } catch (error) {
        if (error.code === 11000 && error.keyPattern['user_id'] && error.keyPattern['item_id'] && error.keyPattern['item_type']) {
            const currentLikeState = await UserLikedItem.findOne({ user_id, item_id, item_type });
            if (currentLikeState) { 
                 await updateLikeCount(item_id, item_type, true); 
                 sendSuccess(res, 200, { liked: true, item_id, item_type }, "Item liked successfully (concurrent operation).");
            } else { 
                 await updateLikeCount(item_id, item_type, false); 
                 sendSuccess(res, 200, { liked: false, item_id, item_type }, "Item unliked successfully (concurrent operation).");
            }
            return;
        }
        next(error);
    }
};

