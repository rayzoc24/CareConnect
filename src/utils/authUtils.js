function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function isValidDarpanId(id) {
  return /^[A-Z]{2}\/\d{4}\/\d{7}$/.test((id || "").trim().toUpperCase());
}

module.exports = {
  normalizeEmail,
  isValidDarpanId
};
