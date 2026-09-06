/**
 * Chromium enforces a hard cap on `navigator.share({ files })` and rejects
 * anything past it with `NotAllowedError`. WebKit imposes no caps at all, so
 * Chromium is the binding constraint on how long a Carousel may be — it binds
 * before Instagram does, which allows 20 items.
 *
 * Source: ticket 01 research, from engine source.
 */
export const CHROMIUM_MAX_FILES = 10;
export const CHROMIUM_MAX_TOTAL_BYTES = 50 * 1024 * 1024;

export interface ShareLimitReport {
  readonly fileCount: number;
  readonly totalBytes: number;
  readonly exceedsFileCount: boolean;
  readonly exceedsTotalBytes: boolean;
  readonly withinChromiumLimits: boolean;
}

/**
 * Note that `navigator.canShare()` cannot do this job: in both engines it only
 * checks that the file array is non-empty, so it returns true for 11 files or
 * for a rejected MIME type. Check the limits ourselves.
 */
export function checkShareLimits(
  files: readonly { readonly size: number }[],
): ShareLimitReport {
  const fileCount = files.length;
  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
  const exceedsFileCount = fileCount > CHROMIUM_MAX_FILES;
  const exceedsTotalBytes = totalBytes > CHROMIUM_MAX_TOTAL_BYTES;

  return {
    fileCount,
    totalBytes,
    exceedsFileCount,
    exceedsTotalBytes,
    withinChromiumLimits: !exceedsFileCount && !exceedsTotalBytes,
  };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
