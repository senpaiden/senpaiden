import { ScrollText } from "lucide-react";
import { LegalPage } from "@/components/LegalPage";
export const metadata = { title: "Terms of Use — SenpaiDen", description: "Rules for using SenpaiDen." };
export default function TermsPage() { return <LegalPage eyebrow="Using SenpaiDen" title="Terms of use" icon={ScrollText} intro="These terms describe the rules that apply when you access or use SenpaiDen." sections={[
  { title: "Acceptance", paragraphs: ["By using SenpaiDen, you agree to these terms and the Privacy Policy. If you do not agree, do not use the service."] },
  { title: "Accounts", bullets: ["Provide accurate information and maintain control of your verified email.", "Do not impersonate others, automate abusive activity or attempt to bypass access controls.", "You are responsible for activity performed through your account."] },
  { title: "Permitted use", paragraphs: ["SenpaiDen is provided for personal discovery and reading-related use. Scraping, resale, service disruption, malicious uploads and infringement are prohibited."] },
  { title: "Intellectual property", paragraphs: ["SenpaiDen branding, product interface and original materials are protected by applicable law. Third-party titles, artwork and trademarks remain the property of their respective owners."] },
  { title: "Subscriptions and rewards", paragraphs: ["Paid plans, promotions and reader rewards may have additional eligibility, availability and fulfillment conditions shown at purchase or claim time. Digital benefits can change when reasonably necessary to operate the service."] },
  { title: "Availability and changes", paragraphs: ["Features and catalogue entries may change, be interrupted or be removed. We may update these terms and will post the revised date on this page."] },
  { title: "Disclaimers and liability", paragraphs: ["The service is provided on an “as available” basis to the extent permitted by law. SenpaiDen is not responsible for third-party services or losses outside its reasonable control."] },
]} />; }
