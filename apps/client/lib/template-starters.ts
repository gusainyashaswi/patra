export interface StarterBlock {
  id?: string;
  type: "text" | "button" | "divider";
  text?: string;
  size?: number;
  weight?: number;
  label?: string;
  href?: string;
  color?: string;
}

export interface TemplateStarter {
  id: string;
  name: string;
  description?: string;
  subject: string;
  previewText: string;
  blocks: StarterBlock[];
}

export interface StarterContent {
  name: string;
  subject: string;
  previewText: string;
  page: { bg: string; width: number; text: string; align: string };
  blocks: Array<StarterBlock & { id: string }>;
  footerText: string;
}

const heading = (text: string): StarterBlock => ({ type: "text", text, size: 30, weight: 700 });
const section = (text: string): StarterBlock => ({ type: "text", text, size: 20, weight: 700 });
const paragraph = (text: string): StarterBlock => ({ type: "text", text, size: 16, weight: 400 });
const button = (label: string, path: string): StarterBlock => ({ type: "button", label, href: `https://example.org/${path}`, color: "#9a3412" });
const divider: StarterBlock = { type: "divider" };

export const starters: TemplateStarter[] = [
  { id: "announcement", name: "Announcement", description: "Share a campus update or a change of plans.", subject: "The campus library is extending its hours", previewText: "See the new evening hours and when they start.", blocks: [heading("More time to study"), paragraph("Starting 23 November, the campus library will stay open later on weekdays."), section("New hours"), paragraph("Monday to Friday · 8 am–10 pm. Weekend hours stay the same."), divider, paragraph("Questions? Reply to this email and the library team will help.")] },
  { id: "invitation", name: "Event invitation", description: "Give people the details and a clear way to register.", subject: "You’re invited to the Campus Design Workshop", previewText: "Join us on 27 November for an afternoon of hands-on design.", blocks: [heading("Campus Design Workshop"), paragraph("Bring an idea and turn it into a prototype with other students. All experience levels are welcome."), section("When and where"), paragraph("27 November · 2–4 pm · Innovation Lab, Building B"), button("Register for the workshop", "workshop/register"), paragraph("Registration is free. Sign up by 25 November.")] },
  { id: "confirmation", name: "Registration confirmation", description: "Confirm a place and give attendees a reference.", subject: "Your Campus Design Workshop spot is confirmed", previewText: "Save your registration reference and check the event details.", blocks: [heading("You’re registered"), paragraph("Hi {{name}}, your spot at the Campus Design Workshop is confirmed."), section("Registration details"), paragraph("Reference: {{ticket_id}}"), paragraph("27 November · 2–4 pm · Innovation Lab, Building B"), button("View event details", "workshop"), paragraph("Keep this email handy for check-in.")] },
  { id: "reminder", name: "Event reminder", description: "Share arrival instructions and what to bring.", subject: "Reminder: Campus Design Workshop on 27 November", previewText: "Check-in starts at 1:45 pm. Bring your laptop.", blocks: [heading("See you at the workshop"), paragraph("The Campus Design Workshop starts at 2 pm on 27 November."), section("Before you arrive"), paragraph("Check in from 1:45 pm at the Innovation Lab, Building B. Bring a laptop and charger."), button("View event details", "workshop"), paragraph("Can’t make it? Reply to let the organizers know.")] },
  { id: "newsletter", name: "Newsletter", description: "Send a roundup with a lead story and short updates.", subject: "Campus Notes · November edition", previewText: "A new makerspace, extended library hours, and a call for volunteers.", blocks: [heading("Campus Notes"), paragraph("November edition"), divider, section("A new space to make things"), paragraph("The campus makerspace is open for student projects. Book an induction to start using the equipment."), button("See makerspace details", "makerspace"), divider, section("More time at the library"), paragraph("From 23 November, the library closes at 10 pm on weekdays."), section("Volunteer at the showcase"), paragraph("Help welcome guests and set up student exhibits. Reply if you’d like to join the team.")] },
];

export const blankStarter: TemplateStarter = { id: "blank", name: "Untitled template", subject: "", previewText: "", blocks: [] };

export function starterContent(starter: TemplateStarter): StarterContent {
  return {
    name: starter.name,
    subject: starter.subject,
    previewText: starter.previewText,
    page: { bg: "#f4eee7", width: 600, text: "#292524", align: "left" },
    blocks: starter.blocks.map((block, index) => ({ ...block, id: `starter-${index}` })),
    footerText: "You’re receiving this email from the organization you subscribed to.",
  };
}
