import mongoose, { Schema, Types } from "mongoose";

export interface INotification {
  recipient: Types.ObjectId;
  item: Types.ObjectId;
  matchedItem: Types.ObjectId;
  title: string;
  message: string;
  type: "potential_match";
  isRead: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    item: {
      type: Schema.Types.ObjectId,
      ref: "Item",
      required: true,
    },

    matchedItem: {
      type: Schema.Types.ObjectId,
      ref: "Item",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ["potential_match"],
      default: "potential_match",
    },

    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Prevent duplicate notifications for the same matching pair.
notificationSchema.index(
  { recipient: 1, item: 1, matchedItem: 1 },
  { unique: true },
);

// Quickly retrieve a user's notifications.
notificationSchema.index({ recipient: 1, createdAt: -1 });

const Notification = mongoose.model<INotification>(
  "Notification",
  notificationSchema,
);

export default Notification;