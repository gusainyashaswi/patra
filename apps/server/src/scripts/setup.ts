import mongoose from "mongoose";
import { z } from "zod";
import { connectDB } from "../db/index.js";
import { User, Organization, Role, Membership } from "../models/identity.model.js";
import "../models/index.js";
import "../config/env.js";

async function main() {
  if (!await connectDB()) throw new Error("Database connection required");
  if (process.argv.includes("--migrate")) {
    const migrations = mongoose.connection.collection("migrations");
    // createIndexes only adds declared indexes; it never drops existing indexes.
    for (const name of ["001-mvp-indexes", "002-transport-default-index"]) {
    if (!await migrations.findOne({ name })) {
      for (const model of Object.values(mongoose.models)) await model.createIndexes();
      await migrations.updateOne({ name }, { $setOnInsert: { appliedAt: new Date() } }, { upsert: true });
    }
    }
    console.log("Database migrations applied");
    return;
  }
  const input = z.object({ OWNER_EMAIL: z.string().email(), OWNER_PASSWORD: z.string().min(12), OWNER_NAME: z.string().default("Owner"), ORG_NAME: z.string().default("Patra"), ORG_SLUG: z.string().regex(/^[a-z0-9-]+$/).default("patra") }).parse(process.env);
  await mongoose.connection.transaction(async session => {
    let user = await User.findOne({ email: input.OWNER_EMAIL.toLowerCase() }).session(session);
    if (!user) [user] = await User.create([{ email: input.OWNER_EMAIL.toLowerCase(), password: input.OWNER_PASSWORD, name: input.OWNER_NAME }], { session });
    const org = await Organization.findOneAndUpdate({ slug: input.ORG_SLUG }, { $setOnInsert: { name: input.ORG_NAME, timezone: "UTC" } }, { upsert: true, new: true, session });
    const existingOwner = await Membership.findOne({ organizationId: org._id }).session(session);
    if (existingOwner && String(existingOwner.userId) !== String(user._id)) throw new Error("Organization already has a different owner");
    const role = await Role.findOneAndUpdate({ name: "org_admin", organizationId: null }, { $setOnInsert: { isSystem: true, permissions: ["manage_transport", "manage_senders", "manage_templates", "manage_contacts", "manage_campaigns", "send_campaigns", "view_overview", "manage_org"] } }, { upsert: true, new: true, session });
    await Membership.updateOne({ userId: user._id, organizationId: org._id }, { $setOnInsert: { roleId: role._id } }, { upsert: true, session });
  });
  console.log("Owner setup complete (existing passwords unchanged)");
}
main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
