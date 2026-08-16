/**
 * Seed script — creates the initial user account.
 * Run: npx tsx scripts/seed.ts
 * Or: npm run seed
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI not set. Create .env.local first.");
  process.exit(1);
}

// Inline model to avoid circular imports
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  hashedPassword: { type: String, required: true },
  name: { type: String, required: true },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model("User", UserSchema);

async function seed() {
  await mongoose.connect(MONGODB_URI!);
  console.log("✅ Connected to MongoDB");

  // Default credentials — change these!
  const email = process.env.SEED_EMAIL ?? "admin@jobpilot.local";
  const password = process.env.SEED_PASSWORD ?? "changeme123";
  const name = process.env.SEED_NAME ?? "Job Seeker";

  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`ℹ️  User ${email} already exists. Skipping.`);
    await mongoose.disconnect();
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  await User.create({ email, name, hashedPassword });

  console.log(`\n✅ User created!`);
  console.log(`   Email:    ${email}`);
  console.log(`   Password: ${password}`);
  console.log(`\n⚠️  Change your password in Settings after first login.\n`);

  await mongoose.disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
