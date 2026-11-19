// Mock data shaped like the PRD's MongoDB collections.
// Replace with API calls (lib/api.js) as each backend milestone lands.

export const org = { id: "org_1", name: "Rishihood Fest", slug: "rishihood-fest" };
export const me = { name: "Shresth Juyal", email: "owner@patra.test" };

export const transports = [
  {
    id: "tr_1",
    type: "RESEND",
    name: "Resend — production",
    status: "CONNECTED",
    isDefault: true,
    credentialMask: "re_••••••••••••7Qk2",
    ratePerSecond: 10,
    dailyLimit: 3000,
    lastTestedAt: "2026-11-05T10:12:00Z",
  },
  {
    id: "tr_2",
    type: "SMTP",
    name: "Campus SMTP relay",
    status: "UNTESTED",
    isDefault: false,
    credentialMask: "smtp.rishihood.edu.in:587 · mailer@••••",
    ratePerSecond: 2,
    dailyLimit: 500,
    lastTestedAt: null,
  },
];

export const domains = [
  { id: "dm_1", name: "mail.rishihoodfest.in", transportId: "tr_1", verified: true },
  { id: "dm_2", name: "rishihood.edu.in", transportId: "tr_2", verified: false },
];

export const senders = [
  {
    id: "sd_1",
    displayName: "Rishihood Fest",
    fromEmail: "hello@mail.rishihoodfest.in",
    replyTo: "team@rishihoodfest.in",
    domainId: "dm_1",
    isDefault: true,
  },
  {
    id: "sd_2",
    displayName: "Fest Tickets",
    fromEmail: "tickets@mail.rishihoodfest.in",
    replyTo: "",
    domainId: "dm_1",
    isDefault: false,
  },
];

export const variables = [
  { key: "name", label: "Name", required: true },
  { key: "email", label: "Email", required: true },
  { key: "college", label: "College", required: false },
  { key: "ticket_id", label: "Ticket ID", required: false },
];

const welcomeBlocks = [
  { id: "b1", type: "image", src: "", alt: "Rishihood Fest banner", height: 160 },
  { id: "b2", type: "text", text: "Hi {{name}},", size: 22, weight: 600, align: "left" },
  {
    id: "b3",
    type: "text",
    text: "Your pass for Rishihood Fest 2026 is confirmed. Three days of music, talks and late-night hackathons start on 21 November.",
    size: 15,
    weight: 400,
    align: "left",
  },
  { id: "b4", type: "button", label: "View my pass", href: "https://rishihoodfest.in/pass", align: "left" },
  { id: "b5", type: "divider" },
  { id: "b6", type: "text", text: "See you on campus — Team Fest", size: 13, weight: 400, align: "left", muted: true },
];

export const templates = [
  {
    id: "tp_1",
    name: "Pass confirmation",
    status: "PUBLISHED",
    latestVersion: 3,
    updatedAt: "2026-11-05T09:20:00Z",
    subject: "Your Rishihood Fest pass, {{name}}",
    previewText: "Three days. One campus. Here's your pass.",
    page: { bg: "#f5f5f4", width: 600, text: "#1c1917", align: "left" },
    blocks: welcomeBlocks,
  },
  {
    id: "tp_2",
    name: "Speaker line-up announcement",
    status: "DRAFT",
    latestVersion: 1,
    updatedAt: "2026-11-06T16:02:00Z",
    subject: "The speaker line-up is here",
    previewText: "Founders, researchers and one surprise guest.",
    page: { bg: "#f5f5f4", width: 600, text: "#1c1917", align: "left" },
    blocks: welcomeBlocks.slice(1, 4),
  },
  {
    id: "tp_3",
    name: "Volunteer onboarding",
    status: "PUBLISHED",
    latestVersion: 1,
    updatedAt: "2026-10-28T12:00:00Z",
    subject: "Welcome to the volunteer crew, {{name}}",
    previewText: "Your shifts, your lead, your t-shirt size.",
    page: { bg: "#f5f5f4", width: 600, text: "#1c1917", align: "left" },
    blocks: welcomeBlocks.slice(1),
  },
];

export const lists = [
  { id: "ls_1", name: "Registered attendees", count: 1248 },
  { id: "ls_2", name: "Volunteers", count: 86 },
  { id: "ls_3", name: "Speakers & guests", count: 24 },
];

const firstNames = ["Aarav", "Diya", "Kabir", "Ananya", "Vihaan", "Ishita", "Arjun", "Meera", "Rohan", "Saanvi", "Aditya", "Kiara", "Reyansh", "Tara", "Neel", "Zoya"];
const lastNames = ["Sharma", "Verma", "Iyer", "Nair", "Gupta", "Kapoor", "Reddy", "Menon", "Bose", "Joshi", "Singh", "Rao"];
const colleges = ["Rishihood University", "Ashoka University", "IIT Delhi", "DTU", "NSUT", "Jamia Millia"];

function seeded(i) {
  const x = Math.sin(i * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

export const contacts = Array.from({ length: 64 }, (_, i) => {
  const f = firstNames[i % firstNames.length];
  const l = lastNames[(i * 7) % lastNames.length];
  return {
    id: `ct_${i + 1}`,
    name: `${f} ${l}`,
    email: `${f}.${l}${i}`.toLowerCase() + "@example.test",
    college: colleges[(i * 3) % colleges.length],
    lists: i % 9 === 0 ? ["Volunteers"] : ["Registered attendees"],
    createdAt: new Date(Date.UTC(2026, 9, 1 + (i % 30))).toISOString(),
    suppressed: i % 23 === 5 ? "Hard bounce" : i % 31 === 7 ? "Unsubscribed" : null,
  };
});

export const campaigns = [
  {
    id: "cp_1",
    name: "Pass confirmations — wave 2",
    status: "SENDING",
    templateId: "tp_1",
    templateVersion: 3,
    senderId: "sd_2",
    listId: "ls_1",
    createdAt: "2026-11-06T17:30:00Z",
    counters: { total: 1248, pending: 412, sent: 236, delivered: 571, bounced: 14, failed: 6, skipped: 9, opened: 288, clicked: 97 },
  },
  {
    id: "cp_2",
    name: "Volunteer briefing",
    status: "COMPLETED",
    templateId: "tp_3",
    templateVersion: 1,
    senderId: "sd_1",
    listId: "ls_2",
    createdAt: "2026-11-02T08:00:00Z",
    counters: { total: 86, pending: 0, sent: 0, delivered: 84, bounced: 1, failed: 0, skipped: 1, opened: 71, clicked: 40 },
  },
  {
    id: "cp_3",
    name: "Pass confirmations — wave 1",
    status: "COMPLETED",
    templateId: "tp_1",
    templateVersion: 2,
    senderId: "sd_2",
    listId: "ls_1",
    createdAt: "2026-10-29T11:00:00Z",
    counters: { total: 640, pending: 0, sent: 0, delivered: 622, bounced: 9, failed: 3, skipped: 6, opened: 401, clicked: 188 },
  },
  {
    id: "cp_4",
    name: "Speaker reveal teaser",
    status: "DRAFT",
    templateId: "tp_2",
    templateVersion: null,
    senderId: "sd_1",
    listId: "ls_1",
    createdAt: "2026-11-06T15:00:00Z",
    counters: { total: 0, pending: 0, sent: 0, delivered: 0, bounced: 0, failed: 0, skipped: 0, opened: 0, clicked: 0 },
  },
];

const errorFor = {
  BOUNCED: "550 5.1.1 Mailbox does not exist",
  FAILED: "Provider timeout after 3 retries",
  SKIPPED: "Missing required variable: name",
};

export function recipientsFor(campaign, n = 40) {
  const pool = ["DELIVERED", "DELIVERED", "OPENED", "CLICKED", "SENT", "PENDING", "DELIVERED", "OPENED", "BOUNCED", "FAILED", "SKIPPED", "PENDING"];
  return Array.from({ length: n }, (_, i) => {
    const c = contacts[i % contacts.length];
    const status = campaign.status === "DRAFT" ? "PENDING" : pool[Math.floor(seeded(i + campaign.id.length) * pool.length)];
    return {
      id: `rc_${campaign.id}_${i}`,
      name: c.name,
      email: c.email,
      status,
      error: errorFor[status] ?? null,
      updatedAt: new Date(Date.UTC(2026, 10, 6, 17, 30 + i)).toISOString(),
    };
  });
}

export const overview = {
  period: "Last 7 days",
  sent: 1974,
  delivered: 1277,
  bounced: 24,
  failed: 9,
  pending: 412,
  series: [120, 340, 210, 90, 640, 180, 394],
  days: ["Fri", "Sat", "Sun", "Mon", "Tue", "Wed", "Thu"],
};

export const setupSteps = [
  { key: "transport", label: "Connect a mail transport", done: true, href: "/settings?tab=transports" },
  { key: "sender", label: "Add a sender on a verified domain", done: true, href: "/settings?tab=senders" },
  { key: "contacts", label: "Import your contacts", done: true, href: "/contacts/import" },
  { key: "template", label: "Design and publish a template", done: true, href: "/templates" },
  { key: "campaign", label: "Send your first campaign", done: false, href: "/campaigns/new" },
];

export const byId = (arr, id) => arr.find((x) => x.id === id);
