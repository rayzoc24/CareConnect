const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    role: { type: String, required: true, enum: ["volunteer", "foundation"] },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    name: { type: String, default: "" },
    phone: { type: String, default: "" },
    orgName: { type: String, default: "" },
    darpanId: { type: String, default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
