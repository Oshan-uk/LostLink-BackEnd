import mongoose, { Schema } from "mongoose"

export interface IItem {
  name: string
  category: string
  description: string
  type: "lost" | "found"
  province: string
  district: string
  city: string
  specificPlace?: string
  date: Date
  imageUrl?: string
  user: mongoose.Types.ObjectId
  status: "active" | "returned"
  createdAt?: Date
  updatedAt?: Date
}

const itemSchema = new Schema<IItem>(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ["lost", "found"],
      required: true
    },
    province: {
      type: String,
      required: true,
      trim: true
    },
    district: {
      type: String,
      required: true,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    specificPlace: {
      type: String,
      trim: true
    },
    date: {
      type: Date,
      required: true
    },
    imageUrl: {
      type: String
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ["active", "returned"],
      default: "active"
    }
  },
  {
    timestamps: true
  }
)

itemSchema.index({
  name: "text",
  description: "text"
})

const Item = mongoose.model<IItem>("Item", itemSchema)

export default Item