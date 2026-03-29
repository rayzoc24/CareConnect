const Ngo = require("../models/Ngo");

async function seedNgos() {
  const count = await Ngo.countDocuments({});
  if (count > 0) return;

  await Ngo.insertMany([
    {
      name: "GreenSteps Foundation",
      type: "Environment",
      focusCategories: ["Cleanliness", "Environment", "Waste"],
      coverage: {
        states: ["Maharashtra", "Karnataka"],
        districts: ["Pune", "Mumbai"],
        areas: ["Kothrud", "Aundh", "Andheri"]
      },
      matchQualityBoost: 6,
      volunteersCount: 240,
      website: "https://greensteps.example.org",
      social: {
        instagram: "@greensteps_org",
        x: "@greensteps_org",
        facebook: "greenstepsfoundation"
      },
      mission: "Urban cleanup, water restoration, and tree drives."
    },
    {
      name: "EduBridge Trust",
      type: "Education",
      focusCategories: ["Education", "Child Welfare", "Digital Literacy"],
      coverage: {
        states: ["Maharashtra", "Gujarat"],
        districts: ["Pune", "Ahmedabad"],
        areas: ["Baner", "Viman Nagar"]
      },
      matchQualityBoost: 4,
      volunteersCount: 412,
      website: "https://edubridge.example.org",
      social: {
        instagram: "@edubridge_trust",
        x: "@edubridge_india",
        facebook: "edubridge"
      },
      mission: "Digital literacy and after-school learning support."
    },
    {
      name: "HealthFirst Collective",
      type: "Healthcare",
      focusCategories: ["Healthcare", "Medical", "Public Health"],
      coverage: {
        states: ["Maharashtra", "Telangana"],
        districts: ["Pune", "Hyderabad"],
        areas: ["Koregaon Park", "Shivajinagar"]
      },
      matchQualityBoost: 5,
      volunteersCount: 178,
      website: "https://healthfirst.example.org",
      social: {
        instagram: "@healthfirst_collective",
        x: "@healthfirstngo",
        facebook: "healthfirstcollective"
      },
      mission: "Community health camps and medicine access support."
    }
  ]);
}

module.exports = {
  seedNgos
};
