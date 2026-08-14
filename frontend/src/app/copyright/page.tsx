import { Copyright } from "lucide-react";
import { LegalPage } from "@/components/LegalPage";
export const metadata = { title: "Copyright & Takedown — SenpaiDen", description: "Report copyright or ownership concerns to SenpaiDen." };
export default function CopyrightPage() { return <LegalPage eyebrow="Rights desk" title="Copyright & takedown" icon={Copyright} intro="SenpaiDen respects intellectual-property rights and reviews sufficiently detailed ownership and takedown reports." sections={[
  { title: "Submit a report", paragraphs: ["Send copyright reports to copyright@senpaiden.com with the subject “Copyright report”. Reports should be submitted by the rights owner or an authorized representative."] },
  { title: "Required information", bullets: ["Your legal name, organization, contact email and authority to act.", "Identification of the protected work.", "The exact SenpaiDen URL for each item at issue.", "A clear explanation of the claimed infringement.", "A good-faith statement that the disputed use is not authorized.", "A statement that the information is accurate, followed by your physical or electronic signature."] },
  { title: "What happens next", paragraphs: ["We may request clarification, restrict access while reviewing a report, notify relevant parties and preserve necessary records. Incomplete or abusive reports may not be actioned."] },
  { title: "Corrections and counter-notices", paragraphs: ["If you believe material was restricted by mistake, contact the same address with the affected URL, supporting rights information and a clear explanation."] },
]} />; }
