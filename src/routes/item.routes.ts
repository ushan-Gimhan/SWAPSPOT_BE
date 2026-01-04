import { Router } from "express";
import { 
  createItem, 
  getAllItems, 
  getItemById, 
  updateItem, 
  deleteItem,
  getMyItems,
} from "../controllers/itemcontroller.controller"; 
import { authenticate } from "../middlewares/auth.middlewares";
import { getAiPriceSuggestion } from "../controllers/aicontroller.controller";

const router = Router();

// --- PUBLIC ROUTES ---
router.get("/", getAllItems);
router.get("/my-items", authenticate, getMyItems);
router.get("/:id", getItemById);



router.post("/create", authenticate, createItem);

router.put("/:id", authenticate, updateItem);
router.delete("/:id", authenticate, deleteItem);

router.post("/ai-price", authenticate, getAiPriceSuggestion);

export default router;