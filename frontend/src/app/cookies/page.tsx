import { Cookie } from "lucide-react";
import { LegalPage } from "@/components/LegalPage";
export const metadata = { title: "Cookie Policy — SenpaiDen", description: "How SenpaiDen uses cookies and similar storage technologies." };
export default function CookiesPage() { return <LegalPage eyebrow="Privacy controls" title="Cookie policy" icon={Cookie} intro="This page explains the storage categories used by SenpaiDen and how you can control optional technologies." sections={[
  { title: "Necessary storage", paragraphs: ["Necessary browser storage supports sign-in state, security, reading progress, referral status and privacy choices. It is required for requested features and cannot be disabled through the consent panel."] },
  { title: "Analytics", paragraphs: ["When enabled, analytics may measure page performance, navigation and aggregate feature usage. Analytics integrations must remain disabled until this category is accepted."] },
  { title: "Advertising", paragraphs: ["When enabled and advertising is implemented, advertising partners may use cookies or similar technologies for delivery, measurement, fraud prevention and—where permitted—personalization. No advertising integration is currently loaded by the consent component itself."] },
  { title: "Managing choices", paragraphs: ["Use “Privacy choices” in the site footer to review or change optional categories. Updated choices replace the previous consent record on this device."] },
  { title: "Regional consent", paragraphs: ["Where required, SenpaiDen will connect advertising to an appropriate certified consent-management platform and pass the resulting consent signals to participating vendors."] },
  { title: "Changes", paragraphs: ["This policy will be updated when vendors or purposes change. Material changes may require visitors to make a new choice."] },
]} />; }
