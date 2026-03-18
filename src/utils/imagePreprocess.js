// ── Constants ─────────────────────────────────────────────────────────────────
const MAX_DIMENSION   = 1600;
const CONTRAST        = 1.2;
const ADAPTIVE_WINDOW = 25;
const ADAPTIVE_T      = 0.15;
const OUTPUT_WHITE    = 245;
const OUTPUT_BLACK    = 30;
const SHARPEN_AMOUNT  = 5;
const BRIGHT_THRESHOLD = 180;
const LOW_THRESHOLD    = 105;
const TARGET_MEAN      = 140;
const MAX_GAMMA        = 2.0;
const MIN_GAMMA        = 0.6;
const HIGHLIGHT_KNEE   = 200;
const HIGHLIGHT_ROLL   = 0.45;
const SHADOW_KNEE      = 60;
const SHADOW_BOOST     = 0.35;

// ── Helpers ───────────────────────────────────────────────────────────────────
function clamp(value) {
  return Math.max(0, Math.min(255, value));
}

function adjustContrast(value, contrast) {
  return clamp((value - 25) * contrast + 25);
}

function applyContrastToGray(gray, contrast) {
  const out = new Uint8ClampedArray(gray.length);
  for (let i = 0; i < gray.length; i++) {
    out[i] = adjustContrast(gray[i], contrast);
  }
  return out;
}

function normalizeExposureGray(gray, mean) {
  if (mean <= BRIGHT_THRESHOLD && mean >= LOW_THRESHOLD) return gray;

  let gamma = 1;
  if (mean > BRIGHT_THRESHOLD) {
    gamma = Math.min(MAX_GAMMA, mean / TARGET_MEAN);
  } else if (mean < LOW_THRESHOLD) {
    gamma = Math.max(MIN_GAMMA, mean / TARGET_MEAN);
  }
  const out = new Uint8ClampedArray(gray.length);

  for (let i = 0; i < gray.length; i++) {
    let v = 255 * Math.pow(gray[i] / 255, gamma);
    if (v > HIGHLIGHT_KNEE) {
      v = HIGHLIGHT_KNEE + (v - HIGHLIGHT_KNEE) * HIGHLIGHT_ROLL;
    }
    if (v < SHADOW_KNEE) {
      v = v + (SHADOW_KNEE - v) * SHADOW_BOOST;
    }
    out[i] = clamp(v);
  }

  return out;
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
Preprocesses an image data URL for OCR.
  Steps: resize → grayscale → deskew → sharpen → adaptive threshold
 
  @param {string} dataUrl - The image as a base64 data URL
  @returns {Promise<string>} - Processed image as a base64 data URL (PNG)
 */
export async function preprocessImage(dataUrl, options = {}) {
  const { binarize = true, normalizeExposureEnabled = true } = options;
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
  const grayRaw   = new Uint8ClampedArray(width * height);
  let sumGray     = 0;

  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    // ITU-R BT.601 luminance weights
    const grayscale = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    grayRaw[p] = grayscale;
    sumGray += grayscale;
  }

  const meanGray = sumGray / grayRaw.length;
  const gray = normalizeExposureEnabled
    ? applyContrastToGray(normalizeExposureGray(grayRaw, meanGray), CONTRAST)
    : applyContrastToGray(grayRaw, CONTRAST);

  // Deskew
  const angle         = detectSkewAngle(gray, width, height);
  const rotatedCanvas = rotateCanvas(canvas, angle);
  const rctx          = rotatedCanvas.getContext("2d", { willReadFrequently: true });
  const rotated       = rctx.getImageData(0, 0, width, height);
  const rotatedPixels = rotated.data;
  const rotatedRaw    = new Uint8ClampedArray(width * height);
  let sumRotated      = 0;

  for (let i = 0, p = 0; i < rotatedPixels.length; i += 4, p++) {
    const grayscale = 0.299 * rotatedPixels[i] + 0.587 * rotatedPixels[i + 1] + 0.114 * rotatedPixels[i + 2];
    rotatedRaw[p] = grayscale;
    sumRotated += grayscale;
  }

  const meanRotated = sumRotated / rotatedRaw.length;
  const rotatedGray = normalizeExposureEnabled
    ? applyContrastToGray(normalizeExposureGray(rotatedRaw, meanRotated), CONTRAST)
    : applyContrastToGray(rotatedRaw, CONTRAST);

  // Sharpen
  const sharpened = applySharpen(rotatedGray, width, height, SHARPEN_AMOUNT);

  if (!binarize) {
    for (let i = 0, p = 0; i < rotated.data.length; i += 4, p++) {
      const v = sharpened[p];
      rotated.data[i] = v;
      rotated.data[i + 1] = v;
      rotated.data[i + 2] = v;
    }
    rctx.putImageData(rotated, 0, 0);
    return rotatedCanvas.toDataURL("image/png");
  }

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
