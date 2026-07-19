import mongoose from "mongoose";

const brandSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  state: {
    brandName: { type: String, default: "" },
    tagline: { type: String, default: "" },
    targetAudience: { type: String, default: "" },
    tone: { type: String, default: "" },
    keywords: { type: [String], default: [] },
  },
  messages: [
    {
      role: {
        type: String,
        enum: ["user", "assistant"],
        required: true,
      },
      content: {
        type: String,
        required: true,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

const Brand = mongoose.model("Brand", brandSchema);

export default Brand;
