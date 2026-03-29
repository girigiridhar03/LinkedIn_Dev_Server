import { config } from "./config/env.config.js";
import app from "./app.js";
import dbConnection from "./config/db.config.js";

dbConnection()
  .then(() => {
    app.listen(config.port, () => {
      console.log(`🚀 Server running on port ${config.port}`);
    });
  })
  .catch((err) => {
    console.error("❌ DB connection failed:", err.message);
    process.exit(1);
  });
