// ── Constants ─────────────────────────────────────────────────────────────────
const MAX_DIMENSION   = 1600;
const CONTRAST        = 1.2;
const ADAPTIVE_WINDOW = 25;
const ADAPTIVE_T      = 0.15;
const OUTPUT_WHITE    = 245;
const OUTPUT_BLACK    = 30;
const SHARPEN_AMOUNT  = 5;

// ── Helpers ───────────────────────────────────────────────────────────────────
function clamp(value) {
  return Math.max(0, Math.min(255, value));
}

function adjustContrast(value, contrast) {
  return clamp((value - 25) * contrast + 25);
}

function applySharpen(gray, width, height, amount) {
  if (!amount) return gray;
  const out = new Uint8ClampedArray(gray.length);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx    = y * width + x;
      const center = gray[idx];
      const left   = x > 0          ? gray[idx - 1]    : center;
      const right  = x < width - 1  ? gray[idx + 1]    : center;
      const up     = y > 0          ? gray[idx - width] : center;
      const down   = y < height - 1 ? gray[idx + width] : center;

      const sharpened = center * 5 - left - right - up - down;
      const boosted   = center + (sharpened - center) * (amount / 10);

      out[idx] = clamp(boosted);
    }
  }

  return out;
}

function detectSkewAngle(gray, width, height) {
  let bestAngle = 0;
  let bestScore = -Infinity;

  for (let angle = -5; angle <= 5; angle += 0.5) {
    const rad = angle * Math.PI / 180;
    const sin = Math.sin(rad);
    const cos = Math.cos(rad);
    let score = 0;

    for (let y = 0; y < height; y += 10) {
      let rowSum = 0;

      for (let x = 0; x < width; x += 10) {
        const xr = Math.floor(x * cos - y * sin);
        const yr = Math.floor(x * sin + y * cos);

        if (xr >= 0 && xr < width && yr >= 0 && yr < height) {
          rowSum += gray[yr * width + xr];
        }
      }

      score += rowSum * rowSum;
    }

    if (score > bestScore) {
      bestScore = score;
      bestAngle = angle;
    }
  }

  return bestAngle;
}

function rotateCanvas(canvas, angle) {
  const rad       = angle * Math.PI / 180;
  const newCanvas = document.createElement("canvas");
  const ctx       = newCanvas.getContext("2d");

  newCanvas.width  = canvas.width;
  newCanvas.height = canvas.height;

  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(rad);
  ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);

  return newCanvas;
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Preprocesses an image data URL for OCR.
 * Steps: resize → grayscale → deskew → sharpen → adaptive threshold
 *
 * @param {string} dataUrl - The image as a base64 data URL
 * @returns {Promise<string>} - Processed image as a base64 data URL (PNG)
 */
export async function preprocessImage(dataUrl) {
  const img = new Image();
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = dataUrl;
  });

  // Resize
  const scale  = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
  const width  = Math.round(img.width  * scale);
  const height = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width  = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, width, height);

  // Grayscale + contrast
  const imageData = ctx.getImageData(0, 0, width, height);
  const data      = imageData.data;
  const gray      = new Uint8ClampedArray(width * height);

  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    // ITU-R BT.601 luminance weights
    const grayscale = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    gray[p] = adjustContrast(grayscale, CONTRAST);
  }

  // Deskew
  const angle         = detectSkewAngle(gray, width, height);
  const rotatedCanvas = rotateCanvas(canvas, angle);
  const rctx          = rotatedCanvas.getContext("2d", { willReadFrequently: true });
  const rotated       = rctx.getImageData(0, 0, width, height);
  const rotatedPixels = rotated.data;
  const rotatedGray   = new Uint8ClampedArray(width * height);

  for (let i = 0, p = 0; i < rotatedPixels.length; i += 4, p++) {
    const grayscale = 0.299 * rotatedPixels[i] + 0.587 * rotatedPixels[i + 1] + 0.114 * rotatedPixels[i + 2];
    rotatedGray[p] = adjustContrast(grayscale, CONTRAST);
  }

  // Sharpen
  const sharpened = applySharpen(rotatedGray, width, height, SHARPEN_AMOUNT);

  // Adaptive threshold (integral image method)
  const integral = new Uint32Array((width + 1) * (height + 1));

  for (let y = 1; y <= height; y++) {
    let rowSum = 0;
    for (let x = 1; x <= width; x++) {
      rowSum += sharpened[(y - 1) * width + (x - 1)];
      integral[y * (width + 1) + x] = integral[(y - 1) * (width + 1) + x] + rowSum;
    }
  }

  const half = Math.floor(ADAPTIVE_WINDOW / 2);

  for (let y = 0; y < height; y++) {
    const y0 = Math.max(0, y - half);
    const y1 = Math.min(height - 1, y + half);

    for (let x = 0; x < width; x++) {
      const x0   = Math.max(0, x - half);
      const x1   = Math.min(width - 1, x + half);
      const area = (x1 - x0 + 1) * (y1 - y0 + 1);

      const sum =
        integral[(y1 + 1) * (width + 1) + (x1 + 1)] -
        integral[(y1 + 1) * (width + 1) + x0] -
        integral[y0 * (width + 1) + (x1 + 1)] +
        integral[y0 * (width + 1) + x0];

      const mean    = sum / area;
      const isBlack = sharpened[y * width + x] < mean * (1 - ADAPTIVE_T);
      const output  = isBlack ? OUTPUT_BLACK : OUTPUT_WHITE;
      const idx     = (y * width + x) * 4;

      rotated.data[idx]     = output;
      rotated.data[idx + 1] = output;
      rotated.data[idx + 2] = output;
    }
  }

  rctx.putImageData(rotated, 0, 0);
  return rotatedCanvas.toDataURL("image/png");
}