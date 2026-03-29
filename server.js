require("dotenv").config();

const { createApp } = require("./src/app");
const { connectDatabase } = require("./src/config/db");
const { seedNgos } = require("./src/config/seed");

const PORT = process.env.PORT || 3000;

async function start() {
  const mongoUri = await connectDatabase();
  await seedNgos();

  const app = createApp();
  app.listen(PORT, () => {
    console.log(`CareConnect server running at http://localhost:${PORT}`);
    console.log(`MongoDB connected: ${mongoUri}`);
  });
}

start().catch((error) => {
  console.error("Failed to start server.");
  console.error(error.message);
  process.exit(1);
});
