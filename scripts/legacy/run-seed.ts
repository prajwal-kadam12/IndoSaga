#!/usr/bin/env tsx

import { checkAndSeed } from "./seed";

console.log("Running database seed script...");

checkAndSeed()
  .then(() => {
    console.log("Seed script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seed script failed:", error);
    process.exit(1);
  });