import { redirect } from "next/navigation";

/** 旧 URL（/learner/study）から学習者トップへ */
export default function LearnerStudyRedirectPage() {
  redirect("/learner");
}
