const Ngo = require("../models/Ngo");

async function listNgos(req, res) {
  const ngos = await Ngo.find({}).sort({ createdAt: 1 }).lean();
  res.json({
    ngos: ngos.map((ngo) => ({
      id: String(ngo._id),
      name: ngo.name,
      type: ngo.type,
      focusCategories: ngo.focusCategories || [],
      coverage: ngo.coverage || { states: [], districts: [], areas: [] },
      matchQualityBoost: Number(ngo.matchQualityBoost || 0),
      volunteersCount: ngo.volunteersCount,
      website: ngo.website,
      social: ngo.social,
      mission: ngo.mission
    }))
  });
}

module.exports = {
  listNgos
};
