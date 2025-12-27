import { Request, Response } from "express"
import { Item, IItem } from "../models/item.model"

export const createItem = async (req: any, res: Response) => {
  try {
    const { title, description, category, price, condition, images, mode } = req.body

    const newItem = new Item({
      userId: req.user._id, // Taken from Auth Middleware
      title,
      description,
      category,
      price,
      condition,
      images,
      mode,
    })

    const savedItem = await newItem.save()
    res.status(201).json({ success: true, data: savedItem })
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message })
  }
}

export const getAllItems = async (req: Request, res: Response) => {
  try {
    const { category, mode, search } = req.query
    const query: any = { isActive: true }

    if (category) query.category = (category as string).toLowerCase()
    if (mode) query.mode = mode
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ]
    }

    const items = await Item.find(query)
      .populate("userId", "fullName email") // Get seller details
      .sort({ createdAt: -1 })

    res.status(200).json({ success: true, count: items.length, data: items })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const getItemById = async (req: Request, res: Response) => {
  try {
    const item = await Item.findById(req.params.id).populate("userId", "fullName email")
    
    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found" })
    }

    res.status(200).json({ success: true, data: item })
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Invalid Item ID" })
  }
}

export const updateItem = async (req: any, res: Response) => {
  try {
    let item = await Item.findById(req.params.id)

    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found" })
    }

    // Check if the user is the owner of the item
    if (item.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to update this item" })
    }

    item = await Item.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })

    res.status(200).json({ success: true, data: item })
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message })
  }
}

export const deleteItem = async (req: any, res: Response) => {
  try {
    const item = await Item.findById(req.params.id)

    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found" })
    }

    // Check ownership
    if (item.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized" })
    }

    // Option 1: Hard delete
    await item.deleteOne()

    // Option 2: Soft delete (Better for marketplaces)
    // item.isActive = false;
    // await item.save();

    res.status(200).json({ success: true, message: "Item removed successfully" })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
}