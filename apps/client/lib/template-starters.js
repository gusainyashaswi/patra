const heading = (text) => ({ type: "text", text, size: 30, weight: 700 });
const section = (text) => ({ type: "text", text, size: 20, weight: 700 });
const paragraph = (text) => ({ type: "text", text, size: 16, weight: 400 });
const button = (label, path) => ({ type: "button", label, href: "https://example.org/" + path, color: "#9a3412" });
const divider = { type: "divider" };

export const starters = [
  {
    id: "announcement",
    name: "Announcement",
    description: "Share a campus update or a change of plans.",
    subject: "The campus library is extending its hours",
    previewText: "See the new evening hours and when they start.",
    blocks: [
      heading("More time to study"),
      paragraph("Starting 23 November, the campus library will stay open later on weekdays."),
      section("New hours"),
      paragraph("Monday to Friday · 8 am–10 pm. Weekend hours stay the same."),
      divider,
      paragraph("Questions? Reply to this email and the library team will help."),
    ],
  },
];

export const blankStarter = { name: "Untitled template", subject: "", previewText: "", blocks: [] };

export function starterContent(starter) {
  return {
    name: starter.name,
    subject: starter.subject,
    previewText: starter.previewText,
    page: { bg: "#f4eee7", width: 600, text: "#292524", align: "left" },
    blocks: starter.blocks.map((block, index) => ({ ...block, id: `starter-${index}` })),
    footerText: "You’re receiving this email from the organization you subscribed to.",
  };
}
