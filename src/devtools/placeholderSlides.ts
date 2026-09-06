/**
 * Placeholder Slides for the ticket-13 share probe.
 *
 * Deliberately NOT the real Slide renderer: these are drawn with plain Canvas
 * 2D and depend on no library, so the probe tests the *share* in isolation and
 * stays independent of ticket 02's snapdom choice and ticket 08's design.
 *
 * Each Slide is hugely numbered, because the question the probe exists to
 * answer is whether saving to the camera roll preserves Carousel order.
 */

/** Instagram keeps original resolution between 1.91:1 and 3:4; 4:5 portrait. */
export const SLIDE_WIDTH = 1080;
export const SLIDE_HEIGHT = 1350;

const HUES = [352, 12, 32, 280, 200, 168, 92, 320, 48, 240, 130, 8];

export interface PlaceholderSlide {
  readonly file: File;
  readonly renderMs: number;
}

export async function renderPlaceholderSlide(
  index: number,
  total: number,
): Promise<PlaceholderSlide> {
  const startedAt = performance.now();

  const canvas = document.createElement("canvas");
  canvas.width = SLIDE_WIDTH;
  canvas.height = SLIDE_HEIGHT;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas context unavailable");

  const hue = HUES[index % HUES.length] ?? 0;
  ctx.fillStyle = `hsl(${hue} 62% 32%)`;
  ctx.fillRect(0, 0, SLIDE_WIDTH, SLIDE_HEIGHT);

  ctx.fillStyle = `hsl(${hue} 70% 22%)`;
  ctx.fillRect(0, SLIDE_HEIGHT - 220, SLIDE_WIDTH, 220);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillStyle = "rgba(255,255,255,0.96)";
  ctx.font = `700 520px system-ui, sans-serif`;
  ctx.fillText(String(index + 1), SLIDE_WIDTH / 2, SLIDE_HEIGHT / 2 - 60);

  ctx.font = `600 64px system-ui, sans-serif`;
  ctx.fillText(
    `Slide ${index + 1} de ${total}`,
    SLIDE_WIDTH / 2,
    SLIDE_HEIGHT - 110,
  );

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", 0.9);
  });
  if (!blob) throw new Error("canvas.toBlob returned null");

  // Zero-padded so lexical filename order matches Carousel order — one of the
  // things the probe is checking.
  const name = `slide-${String(index + 1).padStart(2, "0")}.jpg`;

  return {
    file: new File([blob], name, { type: "image/jpeg" }),
    renderMs: performance.now() - startedAt,
  };
}

export async function renderPlaceholderCarousel(
  total: number,
  onProgress?: (done: number) => void,
): Promise<PlaceholderSlide[]> {
  const slides: PlaceholderSlide[] = [];
  for (let index = 0; index < total; index += 1) {
    slides.push(await renderPlaceholderSlide(index, total));
    onProgress?.(index + 1);
    // Yield so the progress paint lands on a phone.
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  return slides;
}
