/**
 * Capturing Slides to JPEG files (ticket 02).
 *
 * `dpr: 1, scale: 1` is not optional: snapdom defaults `dpr` to
 * `devicePixelRatio`, which on an iPhone turns a 1080x1350 Slide into 3240x4050
 * at roughly 52 MB. WebKit removed the catchable canvas ceiling in 2023, so
 * overshooting kills the tab via jetsam with no error to catch.
 */
import { snapdom } from "@zumer/snapdom";
import { SLIDE_H, SLIDE_W } from "./Slides";

export async function captureSlide(node: HTMLElement, filename: string): Promise<File> {
  const result = await snapdom(node, {
    dpr: 1,
    scale: 1,
    width: SLIDE_W,
    height: SLIDE_H,
    embedFonts: false,
  });

  const blob = await result.toBlob({ type: "jpeg", quality: 0.9 });
  return new File([blob], filename, { type: "image/jpeg" });
}

/** Zero-padded, so lexical filename order matches Carousel order. */
export const slideFilename = (index: number) =>
  `degustacao-${String(index + 1).padStart(2, "0")}.jpg`;
