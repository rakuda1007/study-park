import { redirect } from "next/navigation";

/** 学習者招待はクリエイターの「参加者」に統一 */
export default function AdminInvitationsPage() {
  redirect("/creator/learners");
}
