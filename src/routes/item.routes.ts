import { Router } from "express";
import { 
  createItem, 
  getAllItems, 
  getItemById, 
  updateItem, 
  deleteItem,
} from "../controllers/itemcontroller.controller"; 
import { authenticate } from "../middlewares/auth.middlewares";

const router = Router();

// --- PUBLIC ROUTES ---
router.get("/", getAllItems);
router.get("/:id", getItemById);

// --- PROTECTED ROUTES ---

// CHANGE: Removed 'upload.array("images", 5)'
// The route now expects a standard JSON body containing image URLs
router.post("/create", authenticate, createItem);

router.put("/:id", authenticate, updateItem);
router.delete("/:id", authenticate, deleteItem);

export default router;