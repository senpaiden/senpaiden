import { BadgeIndianRupee } from "lucide-react";
import { LegalPage } from "@/components/LegalPage";
export const metadata = { title: "Affiliate Disclosure — SenpaiDen", description: "How SenpaiDen identifies and handles affiliate links." };
export default function AffiliateDisclosurePage() { return <LegalPage eyebrow="Commercial transparency" title="Affiliate disclosure" icon={BadgeIndianRupee} intro="Some future links on SenpaiDen may earn a commission when a reader completes an eligible purchase. This page explains how those relationships will be handled." sections={[
  { title: "Clear identification", paragraphs: ["Affiliate links or sponsored recommendations will be identified close to the relevant content. A commercial relationship will not be hidden inside navigation or reader controls."] },
  { title: "Editorial independence", paragraphs: ["Payment or commission does not guarantee positive coverage. Recommendations should remain relevant to readers and commercial partners cannot purchase undisclosed editorial conclusions."] },
  { title: "Prices and availability", paragraphs: ["Retail prices, availability and offer terms are controlled by third-party sellers and may change. Readers should review the seller's current terms before purchasing."] },
  { title: "No extra reader cost", paragraphs: ["A tracked affiliate purchase generally does not add a separate charge for the reader, but the seller's normal pricing, tax and delivery terms still apply."] },
  { title: "Questions", paragraphs: ["Commercial and disclosure questions can be sent to partnerships@senpaiden.com."] },
]} />; }
