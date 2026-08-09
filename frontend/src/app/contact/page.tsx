import { Mail } from "lucide-react";
import { LegalPage } from "@/components/LegalPage";
export const metadata = { title: "Contact — SenpaiDen", description: "Contact SenpaiDen support, privacy and copyright teams." };
export default function ContactPage() { return <LegalPage eyebrow="Contact" title="Reach the right desk" icon={Mail} intro="Include the relevant page URL and enough detail for us to understand your request. Do not send passwords, OTPs or payment-card details." sections={[
  { title: "General support", paragraphs: ["Account, product and correction requests: support@senpaiden.com"] },
  { title: "Privacy", paragraphs: ["Privacy and personal-data requests: privacy@senpaiden.com"] },
  { title: "Copyright", paragraphs: ["Copyright and ownership reports: copyright@senpaiden.com. Review the Copyright & Takedown page before submitting."] },
  { title: "Business", paragraphs: ["Advertising, licensing and partnership enquiries: partnerships@senpaiden.com"] },
  { title: "Response expectations", paragraphs: ["Requests are reviewed by category and complexity. Sending duplicate messages can delay review. Legal deadlines, where applicable, take priority."] },
]} />; }
