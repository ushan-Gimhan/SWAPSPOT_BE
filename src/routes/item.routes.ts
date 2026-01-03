import { Router } from "express";
// Ensure the path matches your actual controller filename
import { 
  createItem, 
  getAllItems, 
  getItemById, 
  updateItem, 
  deleteItem,
} from "../controllers/itemcontroller.controller"; 
import { authenticate } from "../middlewares/auth.middlewares";
import multer from "multer";

// Configure Multer (Simple disk storage)
const upload = multer({ dest: "uploads/" }); 

const router = Router();

// --- PUBLIC ROUTES ---
router.get("/", getAllItems);
router.get("/:id", getItemById);

// --- PROTECTED ROUTES ---

// 1. FIX: Added 'authenticate' middleware. 
//    It MUST come before 'createItem' so req.user is set.
// 2. FIX: Changed path to "/create" to match your frontend service.
router.post("/create", authenticate, upload.array("images", 5), createItem);

// 3. FIX: Your AI route was missing a controller. 
//    You need to create a 'getAiPrice' controller or remove this line until ready.
// router.post("/ai-price", authenticate, getAiPrice); 

router.put("/:id", authenticate, updateItem);

router.delete("/:id", authenticate, deleteItem);

export default router;