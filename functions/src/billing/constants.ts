/** お試し満了後、削除までの猶予（日） */
export const TRIAL_GRACE_DAYS = 60;

/** お試し満了前の通知タイミング（日） */
export const TRIAL_NOTIFY_DAYS = [90, 30, 7] as const;

/** 削除予定前の通知（猶予終了の何日前か） */
export const DELETION_NOTIFY_DAYS = [7, 1] as const;
