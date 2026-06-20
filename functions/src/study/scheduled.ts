import { getAdminFirestore } from "../billing/firestore-admin";
import { archiveOldCompletedStudyPlans } from "./archive-completed";
import { collectStudyPlanMetrics, logStudyPlanMetrics } from "./metrics";

export async function runStudyPlanMaintenance(opts?: {
  dryRun?: boolean;
  now?: Date;
}): Promise<{
  archive: Awaited<ReturnType<typeof archiveOldCompletedStudyPlans>>;
  metrics: Awaited<ReturnType<typeof collectStudyPlanMetrics>>;
}> {
  const db = getAdminFirestore();
  const archive = await archiveOldCompletedStudyPlans(db, opts);
  const metrics = await collectStudyPlanMetrics(db);
  logStudyPlanMetrics(metrics);
  console.info("[studyPlanArchive]", JSON.stringify(archive));
  return { archive, metrics };
}
