const mongoose = require("mongoose");

const voteSchema = new mongoose.Schema(
  {
    issueId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    voterUid: { type: String, required: true, index: true }
  },
  { timestamps: true }
);

voteSchema.index({ issueId: 1, voterUid: 1 }, { unique: true });

module.exports = mongoose.model("Vote", voteSchema);
