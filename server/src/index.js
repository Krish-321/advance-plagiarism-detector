const mongoose = require("mongoose");
const { app } = require("./app");
const { env } = require("./config/env");

async function start() {
  if (env.mongoUri) {
    try {
      await mongoose.connect(env.mongoUri);
      // eslint-disable-next-line no-console
      console.log("MongoDB connected");
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn("MongoDB connection failed, continuing without persistence");
      // eslint-disable-next-line no-console
      console.warn(error.message);
    }
  }

  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on port ${env.port}`);
  });
}

start();
