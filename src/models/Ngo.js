const mongoose = require("mongoose");

const ngoSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, required: true },
    focusCategories: { type: [String], default: [] },
    coverage: {
      states: { type: [String], default: [] },
      districts: { type: [String], default: [] },
      areas: { type: [String], default: [] }
    },
    matchQualityBoost: { type: Number, default: 0 },
    volunteersCount: { type: Number, default: 0 },
    website: { type: String, default: "" },
    social: {
      instagram: { type: String, default: "" },
      x: { type: String, default: "" },
      facebook: { type: String, default: "" }
    },
    mission: { type: String, default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ngo", ngoSchema);
