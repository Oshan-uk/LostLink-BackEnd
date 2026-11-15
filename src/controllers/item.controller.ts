import { Request, Response } from "express"
import { QueryFilter } from "mongoose"
import Item, { IItem } from "../models/Item.js"

const escapeRegex = (value: string): string => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

const createItem = async (
  req: Request,
  res: Response,
  type: "lost" | "found"
): Promise<void> => {
  try {
    const {
      name,
      category,
      description,
      province,
      district,
      city,
      specificPlace,
      date,
      imageUrl
    } = req.body

    if (
      !name ||
      !category ||
      !description ||
      !province ||
      !district ||
      !city ||
      !date
    ) {
      res.status(400).json({
        success: false,
        message: "Please provide all required fields"
      })
      return
    }

    const stringFields = [
      name,
      category,
      description,
      province,
      district,
      city
    ]

    if (!stringFields.every((field) => typeof field === "string")) {
      res.status(400).json({
        success: false,
        message: "Invalid input data"
      })
      return
    }

    const itemDate = new Date(date)

    if (Number.isNaN(itemDate.getTime())) {
      res.status(400).json({
        success: false,
        message: "Please provide a valid date"
      })
      return
    }

    if (itemDate > new Date()) {
      res.status(400).json({
        success: false,
        message: "Item date cannot be in the future"
      })
      return
    }

    const item = await Item.create({
      name: name.trim(),
      category: category.trim(),
      description: description.trim(),
      type,
      province: province.trim(),
      district: district.trim(),
      city: city.trim(),
      specificPlace:
        typeof specificPlace === "string"
          ? specificPlace.trim()
          : "",
      date: itemDate,
      imageUrl:
        typeof imageUrl === "string" && imageUrl.trim()
          ? imageUrl.trim()
          : undefined,
      user: req.userId
    })

    res.status(201).json({
      success: true,
      message: `${type} item reported successfully`,
      item
    })
  } catch (error) {
    console.error("Create item error:", error)

    res.status(500).json({
      success: false,
      message: "Failed to create item report"
    })
  }
}

export const createLostItem = async (
  req: Request,
  res: Response
): Promise<void> => {
  await createItem(req, res, "lost")
}

export const createFoundItem = async (
  req: Request,
  res: Response
): Promise<void> => {
  await createItem(req, res, "found")
}

export const getAllItems = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      search,
      type,
      category,
      province,
      district,
      city,
      status,
      page,
      limit
    } = req.query

    const filter: QueryFilter<IItem> = {
      status: "active"
    }

    if (status === "returned") {
      filter.status = "returned"
    }

    if (status === "all") {
      delete filter.status
    }

    if (type === "lost" || type === "found") {
      filter.type = type
    }

    if (typeof search === "string" && search.trim()) {
      const searchPattern = new RegExp(
        escapeRegex(search.trim()),
        "i"
      )

      filter.$or = [
        { name: searchPattern },
        { description: searchPattern }
      ]
    }

    if (typeof category === "string" && category.trim()) {
      filter.category = new RegExp(
        `^${escapeRegex(category.trim())}$`,
        "i"
      )
    }

    if (typeof province === "string" && province.trim()) {
      filter.province = new RegExp(
        `^${escapeRegex(province.trim())}$`,
        "i"
      )
    }

    if (typeof district === "string" && district.trim()) {
      filter.district = new RegExp(
        `^${escapeRegex(district.trim())}$`,
        "i"
      )
    }

    if (typeof city === "string" && city.trim()) {
      filter.city = new RegExp(
        `^${escapeRegex(city.trim())}$`,
        "i"
      )
    }

    const currentPage = Math.max(1, Number(page) || 1)
    const itemsPerPage = Math.min(
      50,
      Math.max(1, Number(limit) || 12)
    )

    const skip = (currentPage - 1) * itemsPerPage

    const [items, totalItems] = await Promise.all([
      Item.find(filter)
        .populate("user", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(itemsPerPage),

      Item.countDocuments(filter)
    ])

    res.status(200).json({
      success: true,
      totalItems,
      currentPage,
      totalPages: Math.ceil(totalItems / itemsPerPage),
      items
    })
  } catch (error) {
    console.error("Get items error:", error)

    res.status(500).json({
      success: false,
      message: "Failed to retrieve items"
    })
  }
}

export const getItemById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const itemId = String(req.params.id)

    if (!/^[a-fA-F0-9]{24}$/.test(itemId)) {
      res.status(400).json({
        success: false,
        message: "Invalid item ID"
      })
      return
    }

    const item = await Item.findById(itemId)
      .populate("user", "name")

    if (!item) {
      res.status(404).json({
        success: false,
        message: "Item not found"
      })
      return
    }

    res.status(200).json({
      success: true,
      item
    })
  } catch (error) {
    console.error("Get item error:", error)

    res.status(500).json({
      success: false,
      message: "Failed to retrieve item"
    })
  }
}

export const getMyItems = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const items = await Item.find({
      user: req.userId
    }).sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      totalItems: items.length,
      items
    })
  } catch (error) {
    console.error("Get my items error:", error)

    res.status(500).json({
      success: false,
      message: "Failed to retrieve your reports"
    })
  }
}

export const updateItem = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const itemId = String(req.params.id)

    if (!/^[a-fA-F0-9]{24}$/.test(itemId)) {
      res.status(400).json({
        success: false,
        message: "Invalid item ID"
      })
      return
    }

    const item = await Item.findById(itemId)

    if (!item) {
      res.status(404).json({
        success: false,
        message: "Item not found"
      })
      return
    }

    if (item.user.toString() !== req.userId) {
      res.status(403).json({
        success: false,
        message: "You are not allowed to update this item"
      })
      return
    }

    const allowedFields = [
      "name",
      "category",
      "description",
      "province",
      "district",
      "city",
      "specificPlace",
      "date",
      "imageUrl"
    ]

    const updates: Record<string, unknown> = {}

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field]
      }
    }

    if (Object.keys(updates).length === 0) {
      res.status(400).json({
        success: false,
        message: "No valid update fields provided"
      })
      return
    }

    const textFields = [
      "name",
      "category",
      "description",
      "province",
      "district",
      "city",
      "specificPlace",
      "imageUrl"
    ]

    for (const field of textFields) {
      if (
        updates[field] !== undefined &&
        typeof updates[field] !== "string"
      ) {
        res.status(400).json({
          success: false,
          message: `Invalid ${field} value`
        })
        return
      }

      if (typeof updates[field] === "string") {
        updates[field] = (updates[field] as string).trim()
      }
    }

    if (updates.date !== undefined) {
      const updatedDate = new Date(updates.date as string)

      if (
        Number.isNaN(updatedDate.getTime()) ||
        updatedDate > new Date()
      ) {
        res.status(400).json({
          success: false,
          message: "Please provide a valid item date"
        })
        return
      }

      updates.date = updatedDate
    }

    const updatedItem = await Item.findByIdAndUpdate(
      itemId,
      { $set: updates },
      {
        new: true,
        runValidators: true
      }
    )

    res.status(200).json({
      success: true,
      message: "Item updated successfully",
      item: updatedItem
    })
  } catch (error) {
    console.error("Update item error:", error)

    res.status(500).json({
      success: false,
      message: "Failed to update item"
    })
  }
}

export const deleteItem = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const itemId = String(req.params.id)

    if (!/^[a-fA-F0-9]{24}$/.test(itemId)) {
      res.status(400).json({
        success: false,
        message: "Invalid item ID"
      })
      return
    }

    const item = await Item.findById(itemId)

    if (!item) {
      res.status(404).json({
        success: false,
        message: "Item not found"
      })
      return
    }

    if (item.user.toString() !== req.userId) {
      res.status(403).json({
        success: false,
        message: "You are not allowed to delete this item"
      })
      return
    }

    await item.deleteOne()

    res.status(200).json({
      success: true,
      message: "Item deleted successfully"
    })
  } catch (error) {
    console.error("Delete item error:", error)

    res.status(500).json({
      success: false,
      message: "Failed to delete item"
    })
  }
}

export const markItemReturned = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const itemId = String(req.params.id)

    if (!/^[a-fA-F0-9]{24}$/.test(itemId)) {
      res.status(400).json({
        success: false,
        message: "Invalid item ID"
      })
      return
    }

    const item = await Item.findById(itemId)

    if (!item) {
      res.status(404).json({
        success: false,
        message: "Item not found"
      })
      return
    }

    if (item.user.toString() !== req.userId) {
      res.status(403).json({
        success: false,
        message: "You are not allowed to update this item"
      })
      return
    }

    item.status = "returned"

    await item.save()

    res.status(200).json({
      success: true,
      message: "Item marked as returned",
      item
    })
  } catch (error) {
    console.error("Mark returned error:", error)

    res.status(500).json({
      success: false,
      message: "Failed to update item status"
    })
  }
}