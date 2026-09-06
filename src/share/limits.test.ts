import { describe, expect, it } from "vitest";
import {
  CHROMIUM_MAX_FILES,
  CHROMIUM_MAX_TOTAL_BYTES,
  checkShareLimits,
  formatBytes,
} from "./limits";

const filesOf = (count: number, size: number) =>
  Array.from({ length: count }, () => ({ size }));

describe("checkShareLimits", () => {
  it("accepts a Carousel at exactly the Chromium file cap", () => {
    const report = checkShareLimits(filesOf(CHROMIUM_MAX_FILES, 1024));
    expect(report.exceedsFileCount).toBe(false);
    expect(report.withinChromiumLimits).toBe(true);
  });

  it("rejects one Slide past the file cap", () => {
    const report = checkShareLimits(filesOf(CHROMIUM_MAX_FILES + 1, 1024));
    expect(report.exceedsFileCount).toBe(true);
    expect(report.withinChromiumLimits).toBe(false);
  });

  it("rejects a Carousel over the total byte budget", () => {
    const report = checkShareLimits([
      { size: CHROMIUM_MAX_TOTAL_BYTES },
      { size: 1 },
    ]);
    expect(report.exceedsTotalBytes).toBe(true);
    expect(report.withinChromiumLimits).toBe(false);
  });

  it("sums bytes across Slides", () => {
    expect(checkShareLimits(filesOf(4, 250)).totalBytes).toBe(1000);
  });

  it("treats an empty Carousel as within limits but empty", () => {
    const report = checkShareLimits([]);
    expect(report.fileCount).toBe(0);
    expect(report.withinChromiumLimits).toBe(true);
  });
});

describe("formatBytes", () => {
  it("scales units", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2.0 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.00 MB");
  });
});
