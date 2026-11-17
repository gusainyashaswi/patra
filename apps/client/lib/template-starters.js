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
  {
    id: "invitation",
    name: "Event invitation",
    description: "Give people the details and a clear way to register.",
    subject: "You’re invited to the Campus Design Workshop",
    previewText: "Join us on 27 November for an afternoon of hands-on design.",
    blocks: [
      heading("Campus Design Workshop"),
      paragraph("Bring an idea and turn it into a prototype with other students. All experience levels are welcome."),
      section("When and where"),
      paragraph("27 November · 2–4 pm · Innovation Lab, Building B"),
      button("Register for the workshop", "workshop/register"),
      paragraph("Registration is free. Sign up by 25 November."),
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
