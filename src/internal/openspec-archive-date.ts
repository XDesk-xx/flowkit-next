/** OpenSpec 1.10.0 names archives using the host's local calendar date. */
export function openSpecArchiveDate(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Replaying OpenSpec requires the immutable prestate's dated destination. */
export function assertOpenSpecArchiveDate(
  defaultPath: string,
  changeId: string,
) {
  if (
    defaultPath !==
    `openspec/changes/archive/${openSpecArchiveDate()}-${changeId}`
  )
    throw Error("archive-date-drift");
}
