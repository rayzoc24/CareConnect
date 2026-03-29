const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema(
  {
    ngoId: { type: String, required: true },
    volunteerUid: { type: String, required: true },
    volunteerName: { type: String, default: "Anonymous" },
    amount: { type: Number, required: true },
    note: { type: String, default: "" },
    createdAt: { type: String, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Donation", donationSchema);
