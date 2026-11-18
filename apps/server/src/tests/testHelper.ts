import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { GenericContainer, type StartedTestContainer, Wait } from "testcontainers";
import { getRedisConnection, closeRedisConnection } from "../lib/redis.js";
import { registerTransport, fakeTransport, clearTransportCache } from "../transports/index.js";
import { closeAllQueues } from "../queue/send.queue.js";
import { stopAllWorkers } from "../worker.js";
import { stopReconciliation } from "../queue/reconcile.js";
import { User, Organization, Role, Membership } from "../models/identity.model.js";
import { MailTransport, Domain, SenderIdentity } from "../models/mailTransport.model.js";
import { Template, TemplateVersion } from "../models/template.model.js";
import { Contact, List } from "../models/audience.model.js";


let replSet: MongoMemoryReplSet | null = null;
let redisContainer: StartedTestContainer | null = null;

export async function setupTestRedis(): Promise<string> {
  if (process.env.REDIS_URL && !redisContainer) return process.env.REDIS_URL;
  if (!redisContainer) {
    redisContainer = await new GenericContainer("redis:7.4-alpine")
      .withExposedPorts(6379)
      .withWaitStrategy(Wait.forLogMessage(/Ready to accept connections/))
      .start();
    const url = `redis://${redisContainer.getHost()}:${redisContainer.getMappedPort(6379)}`;
    process.env.REDIS_URL = url;
    return url;
  }

  return `redis://${redisContainer.getHost()}:${redisContainer.getMappedPort(6379)}`;
}

export async function setupTestDb(): Promise<string> {
  await setupTestRedis();
  if (!replSet) {
    replSet = await MongoMemoryReplSet.create({
      replSet: { count: 1, storageEngine: "wiredTiger" },
    });
    const uri = replSet.getUri("patra");
    await mongoose.connect(uri);
  }
  return replSet.getUri("patra");
}

export async function teardownTestDb(): Promise<void> {
  await stopReconciliation();
  await stopAllWorkers();
  await closeAllQueues();
  await closeRedisConnection();

  if (redisContainer) {
    await redisContainer.stop();
    redisContainer = null;
  }

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (replSet) {
    await replSet.stop();
    replSet = null;
  }
}

export async function clearTestDb(): Promise<void> {
  fakeTransport.reset();
  clearTransportCache();

  // Clear Redis
  const redis = getRedisConnection();
  try {
    await redis.flushall();
  } catch {
    // Ignore flush errors in unit tests if redis was mocked
  }

  // Clear Mongo collections
  if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
    const collections = await mongoose.connection.db.collections();
    for (const c of collections) {
      await c.deleteMany({});
    }
  }
}

export interface SeededContext {
  user: any;
  accessToken: string;
  organization: any;
  transport: any;
  domain: any;
  sender: any;
  template: any;
  templateVersion: any;
  list: any;
  contacts: any[];
}

export async function seedTestContext(): Promise<SeededContext> {
  const org = await Organization.create({
    name: "Test Org",
    slug: `test-org-${Date.now()}-${Math.random()}`,
    timezone: "UTC",
  });

  const user = await User.create({
    email: `test-${Date.now()}-${Math.random()}@example.com`,
    name: "Test User",
    password: "Password123!",
  });

  const role = await Role.findOneAndUpdate(
    { name: "org_admin", organizationId: null },
    {
      $setOnInsert: {
        description: "Admin",
        permissions: [
          "manage_transport",
          "manage_senders",
          "manage_templates",
          "manage_contacts",
          "manage_campaigns",
          "send_campaigns",
          "view_overview",
          "manage_org",
        ],
        isSystem: true,
      },
    },
    { upsert: true, new: true },
  );

  await Membership.create({
    userId: user._id,
    organizationId: org._id,
    roleId: role._id,
  });

  const accessToken = user.generateAccessToken(role.permissions);

  const transport = await MailTransport.create({
    organizationId: org._id,
    name: "Test Transport",
    type: "RESEND",
    credentialsEncrypted: "dummy.encrypted.key",
    ratePerSecond: 10,
    dailyLimit: 1000,
    status: "VERIFIED",
    isDefault: true,
  });

  // Always bind fakeTransport to this transport ID
  registerTransport(transport._id.toString(), fakeTransport);

  const domain = await Domain.create({
    organizationId: org._id,
    transportId: transport._id,
    name: "example.com",
    verified: true,
  });

  const sender = await SenderIdentity.create({
    organizationId: org._id,
    domainId: domain._id,
    displayName: "Test Sender",
    fromEmail: "newsletter@example.com",
    replyTo: "support@example.com",
    isDefault: true,
  });

  const template = await Template.create({
    organizationId: org._id,
    name: "Welcome Newsletter",
    status: "PUBLISHED",
  });

  const templateVersion = await TemplateVersion.create({
    organizationId: org._id,
    templateId: template._id,
    version: 1,
    subject: "Welcome to Patra, {{name}}!",
    html: "<!doctype html><html><body><h1>Hello {{name}}</h1><p>Your ticket is {{ticket}}</p></body></html>",
    text: "Hello {{name}}\nYour ticket is {{ticket}}",
    variables: ["name", "ticket"],
    blocks: [],
  });

  const contacts = await Contact.create([
    {
      organizationId: org._id,
      name: "Alice",
      email: "alice@test.com",
      customFields: { ticket: "TCK-101" },
    },
    {
      organizationId: org._id,
      name: "Bob",
      email: "bob@test.com",
      customFields: { ticket: "TCK-102" },
    },
    {
      organizationId: org._id,
      name: "Charlie (Missing Variable)",
      email: "charlie@test.com",
      customFields: {}, // missing "ticket"
    },
  ]);

  const list = await List.create({
    organizationId: org._id,
    name: "Subscribers",
    contactIds: contacts.map((c) => c._id),
  });

  return {
    user,
    accessToken,
    organization: org,
    transport,
    domain,
    sender,
    template,
    templateVersion,
    list,
    contacts,
  };
}
