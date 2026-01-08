import { Request, Response } from 'express'
import { Item } from '../models/item.model' // Ensure this path matches your file structure
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

export const deleteItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await Item.findByIdAndDelete(id);
    res.status(200).json({ message: "Item deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete item" });
  }
};

export const getMyItems = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    // ✅ FIX: Look for 'sub' as well
    const userId = user.id || user._id || user.sub;

    if (!userId) {
      console.log("Debug: Token Payload:", user); // Log if it still fails
      return res.status(401).json({ message: "Unauthorized: No user ID found." });
    }

    const items = await Item.find({ userId: userId }).sort({ createdAt: -1 });
    res.status(200).json(items);

  } catch (error) {
    console.error("Error fetching user items:", error);
    res.status(500).json({ message: "Server error while fetching your items." });
  }
};

// /api/v1/items/others
export const getOthersItems = async (req: AuthRequest, res: Response) => {
  try {
    // 1. Identify the current user
    const userId = req.user?.id || req.user?._id || req.user?.sub;

    if (!userId) {
      return res.status(401).json({ message: "User identity missing" });
    }

    // 2. Fetch items where userId is NOT equal ($ne) to the current user
    // We also likely want the most recent items first (.sort)
    const items = await Item.find({ 
      userId: { $ne: userId } 
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: items.length,
      data: items
    });

  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err?.message || "Server error" });
  }
}


// /api/v1/items
export const getAllItem = async (req: AuthRequest, res: Response) => {
  try {
    // Fetch all items, most recent first
    const items = await Item.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err?.message || "Server error" });
  }
};

// --- Update Item Status (Moderation) ---
export const updateItemStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate if the status is one of the allowed types
    const allowedStatuses = ["available", "pending", "sold"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const updatedItem = await Item.findByIdAndUpdate(
      id,
      { status },
      { new: true } // returns the document after update
    );

    if (!updatedItem) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.status(200).json({
      message: "Item status updated successfully",
      data: updatedItem
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

import PDFDocument from "pdfkit";

// Use your frontend Item interface for type safety
interface IItem {
  _id: string;
  title: string;
  category: string;
  price?: number;
  status: "available" | "pending" | "sold";
  sellerName: string;
  sellerImage?: string;
  images?: string[];
}

export const createItmReports = async (req: Request<{}, {}, { items: IItem[] }>, res: Response) => {
  try {
    const { items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "No items provided for report." });
    }

    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=Item_Report.pdf');

    doc.pipe(res);

    // Title
    doc.fillColor('#0f172a').fontSize(20).text('Item Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#64748b').text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(2);

    // Table headers
    const tableTop = 130;
    const col1 = 50;   // Title
    const col2 = 250;  // Category
    const col3 = 400;  // Price
    const col4 = 500;  // Status

    doc.font('Helvetica-Bold').fontSize(10).fillColor('#1e293b');
    doc.text('TITLE', col1, tableTop);
    doc.text('CATEGORY', col2, tableTop);
    doc.text('PRICE (LKR)', col3, tableTop);
    doc.text('STATUS', col4, tableTop);

    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).strokeColor('#e2e8f0').stroke();

    // Table body
    let currentY = tableTop + 25;
    doc.font('Helvetica').fontSize(10).fillColor('#1e293b');

    items.forEach((item) => {
      if (currentY > 750) {
        doc.addPage();
        currentY = 50;
      }

      doc.text(item.title, col1, currentY, { width: 180, ellipsis: true });
      doc.text(item.category, col2, currentY);
      doc.text(item.price?.toLocaleString() || '0', col3, currentY);
      doc.text(item.status, col4, currentY);

      currentY += 20;
    });

    doc.end();

  } catch (error) {
    console.error("Error generating item report PDF:", error);
    res.status(500).json({ message: "Server error while generating report." });
  }
};


