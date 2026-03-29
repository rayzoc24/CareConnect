const mongoose = require("mongoose");

async function connectDatabase() {
  const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/careconnect";
  await mongoose.connect(mongoUri);
  return mongoUri;
}

module.exports = {
  connectDatabase
};
