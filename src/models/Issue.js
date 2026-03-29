const mongoose = require("mongoose");
const { STATUS } = require("../constants/status");

const issueSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    ngoId: { type: String, required: true },
    location: {
      state: { type: String, default: "" },
      district: { type: String, default: "" },
      area: { type: String, default: "" }
    },
    createdByUid: { type: String, required: true },
    createdByName: { type: String, default: "Volunteer" },
    hashtags: { type: [String], default: [] },
    photoUrl: { type: String, default: "" },
    votes: { type: Number, default: 0 },
    status: { type: String, default: STATUS.PENDING },
    claimedBy: {
      ngoUid: { type: String, default: "" },
      ngoName: { type: String, default: "" },
      claimedAt: { type: String, default: "" }
    },
    ai: {
      autoCategory: { type: String, default: "General" },
      priority: { type: Number, default: 30 },
      reasoning: { type: String, default: "" }
    },
    ratings: {
      type: [
        {
          volunteerUid: { type: String, required: true },
          volunteerName: { type: String, default: "Volunteer" },
          stars: { type: Number, required: true },
          feedback: { type: String, default: "" },
          createdAt: { type: String, required: true }
        }
      ],
      default: []
    },
    averageRating: { type: Number, default: 0 },
    history: {
      type: [
        {
          event: { type: String, required: true },
          actor: { type: String, required: true },
          note: { type: String, default: "" },
          createdAt: { type: String, required: true }
        }
      ],
      default: []
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Issue", issueSchema);
