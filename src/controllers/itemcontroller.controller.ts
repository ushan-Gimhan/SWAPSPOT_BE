import { Request, Response } from 'express'
import { Item, IItem } from '../models/item.model' // Ensure this path matches your file structure
import { AuthRequest } from "../middlewares/auth.middlewares"; // Or wherever your interface is defined

// /api/v1/items/create
export const createItem = async (req: AuthRequest, res: Response) => {
  try {
    // User ID Check
    const userId = req.user?.id || req.user?._id || req.user?.sub;

    if (!userId) {
      return res.status(401).json({ message: "User identity missing from token" });
    }

    // Destructure (Now including 'images')
    const { title, description, category, price, condition, mode, seeking, aiSuggestedPrice, images } = req.body;

    //Validation
    if (!title || !description || !category || !condition || !mode) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    // 4. Create Item
    const newItem = new Item({
      userId: userId,
      title,
      description,
      category,
      price: (mode === 'CHARITY' || mode === 'EXCHANGE') ? 0 : Number(price),
      condition,
      mode,
      seeking: (mode === 'EXCHANGE') ? seeking : "",
      aiSuggestedPrice,
      // CHANGE: Directly use the array of URLs sent from frontend
      // If images is undefined, default to empty array
      images: Array.isArray(images) ? images : [] 
    });

    const savedItem = await newItem.save();

    res.status(201).json({
      message: "Item created successfully",
      data: savedItem
    });

  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err?.message || "Server error" });
  }
}

// /api/v1/items (Get All with Filters + Pagination)
export const getAllItems = async (req: Request, res: Response) => {
  try {
    //Get Query Params (with defaults)
    const { category, mode, search, page, limit } = req.query;
    
    //Page 1, 20 items per page
    const pageNumber = parseInt(page as string) || 1;
    const limitNumber = parseInt(limit as string) || 20;
    const skip = (pageNumber - 1) * limitNumber;

    const query: any = { isActive: true };

    //Apply Filters
    if (category) query.category = (category as string).toLowerCase();
    if (mode) query.mode = (mode as string).toUpperCase();
    
    //Apply Search
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    //Run Queries in Parallel (Get Items + Get Total Count)
    const [items, totalItems] = await Promise.all([
      Item.find(query)
        .populate("userId", "fullName email avatar") // Added avatar if you have it
        .sort({ createdAt: -1 }) // Newest first
        .skip(skip)              // Skip previous pages
        .limit(limitNumber),     // Limit results
      Item.countDocuments(query) // Count total for pagination UI
    ]);

    //Send Response
    res.status(200).json({
      message: "success",
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / limitNumber),
        currentPage: pageNumber,
        itemsPerPage: limitNumber,
        hasNextPage: pageNumber * limitNumber < totalItems,
        hasPrevPage: pageNumber > 1
      },
      data: items
    });

  } catch (err: any) {
    res.status(500).json({ message: err?.message || "Server Error" });
  }
};

// /api/v1/items/:id
export const getItemById = async (req: Request, res: Response) => {
  try {
    const item = await Item.findById(req.params.id).populate("userId", "fullName email")
    
    if (!item) {
      return res.status(404).json({ message: "Item not found" })
    }

    res.status(200).json({
      message: "success",
      data: item
    })
  } catch (err: any) {
    res.status(500).json({ message: "Invalid Item ID" })
  }
}

// /api/v1/items/:id (Update)
export const updateItem = async (req: AuthRequest, res: Response) => {
  try {
    let item = await Item.findById(req.params.id)

    if (!item) {
      return res.status(404).json({ message: "Item not found" })
    }

    // Check Ownership
    // Using loose equality (==) or toString() handles objectId vs string comparison
    const userId = req.user?.id || req.user?._id || req.user?.sub;
    
    if (item.userId.toString() !== userId?.toString()) {
      return res.status(403).json({ message: "Not authorized to update this item" })
    }

    // Update
    item = await Item.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })

    res.status(200).json({
      message: "Item updated successfully",
      data: item
    })
  } catch (err: any) {
    res.status(400).json({ message: err?.message })
  }
}

// /api/v1/items/:id (Delete)
export const deleteItem = async (req: AuthRequest, res: Response) => {
  try {
    const item = await Item.findById(req.params.id)

    if (!item) {
      return res.status(404).json({ message: "Item not found" })
    }

    // Check Ownership
    const userId = req.user?.id || req.user?._id || req.user?.sub;

    if (item.userId.toString() !== userId?.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this item" })
    }

    // Hard Delete
    await item.deleteOne()

    res.status(200).json({ 
      message: "Item removed successfully" 
    })
  } catch (err: any) {
    res.status(500).json({ message: err?.message })
  }
}