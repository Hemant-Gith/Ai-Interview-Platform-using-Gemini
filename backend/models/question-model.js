import mongoose from "mongoose";

const questionsSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
    },
    question: String,
    answer: String,
    note: { type: String, default: "" },
    isPinned: { type: Boolean, default: false },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
  },
  { timestamps: true },
);

const Question = mongoose.model("Question", questionsSchema);
export default Question;
