const Donation = require("../models/Donation");

async function listDonations(req, res) {
  const donations = await Donation.find({}).sort({ createdAt: -1 }).lean();
  res.json({
    donations: donations.map((don) => ({
      id: String(don._id),
      ngoId: don.ngoId,
      volunteerUid: don.volunteerUid,
      volunteerName: don.volunteerName,
      amount: don.amount,
      note: don.note,
      createdAt: don.createdAt
    }))
  });
}

async function createDonation(req, res) {
  const sessionUser = req.session.user;
  const ngoId = String(req.body.ngoId || "").trim();
  const volunteerUid = String(sessionUser.id || "").trim();
  const volunteerName = String(sessionUser.name || "Anonymous").trim();
  const amount = Number(req.body.amount || 0);
  const note = String(req.body.note || "").trim();

  if (!ngoId || !volunteerUid || amount <= 0) {
    res.status(400).json({ error: "Invalid donation payload." });
    return;
  }

  const entry = await Donation.create({
    ngoId,
    volunteerUid,
    volunteerName,
    amount,
    note,
    createdAt: new Date().toISOString()
  });

  res.status(201).json({
    donation: {
      id: String(entry._id),
      ngoId: entry.ngoId,
      volunteerUid: entry.volunteerUid,
      volunteerName: entry.volunteerName,
      amount: entry.amount,
      note: entry.note,
      createdAt: entry.createdAt
    }
  });
}

module.exports = {
  listDonations,
  createDonation
};
