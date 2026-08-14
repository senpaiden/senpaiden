import { BookOpen } from "lucide-react";
import { LegalPage } from "@/components/LegalPage";
export const metadata = { title: "About — SenpaiDen", description: "Learn about SenpaiDen's mission and reader experience." };
export default function AboutPage() { return <LegalPage eyebrow="Inside the den" title="Built for manga discovery" icon={BookOpen} intro="SenpaiDen is a reader-focused discovery platform designed to help fans find series, organize their library and follow their reading journey." sections={[
  { title: "Our mission", paragraphs: ["We want manga discovery to feel clear, fast and personal. SenpaiDen combines searchable catalogue information, reading tools and progression features in one focused experience."] },
  { title: "What we publish", bullets: ["Catalogue information and discovery tools.", "Reader utilities including library, history and progress tracking.", "Original product copy, recommendations and editorial context where available."] },
  { title: "Rights and availability", paragraphs: ["Names, artwork and trademarks relating to third-party works belong to their respective owners. Availability may change when ownership, licensing or accuracy concerns are reported."] },
  { title: "How to reach us", paragraphs: ["For product questions, corrections, partnerships or rights concerns, use the Contact page so your request reaches the appropriate queue."] },
]} />; }
