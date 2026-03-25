// Date helpers
export function formatDateMmDdYyyy(input) {
  if (!input) return "";
  const [mm, dd, yyyy] = input.split(/[./-]/).map((v) => v.trim());
  if (!mm || !dd || !yyyy) return "";
  const month = mm.padStart(2, "0");
  const day = dd.padStart(2, "0");
  const year = yyyy.length === 2 ? `20${yyyy}` : yyyy;
  return `${year}-${month}-${day}`; // Return YYYY-MM-DD for dayjs compatibility
}

// Ticket parser
export function parseTicket(text) {
  const cleanedText = text
    .replace(/O/g, "0")
    .replace(/S/g, "5")
    .replace(/I/g, "1");

  let timePaidDate = "";
  let totalAmountDue = "";

  // Anchor to TIME PAID label — far more reliable than a bare date+timestamp.
  // Loose timestamp separator ([:;]) handles OCR misreads on wrinkled receipts.
  // Falls back to any date+timestamp if the label is not found.
  const dateMatch =
    text.match(/T[I1]ME\s*PA[I1]D\s*[:\s]+(\d{2}[/-]\d{2}[/-]\d{4})/i) ||
    cleanedText.match(/T[I1]ME\s*PA[I1]D\s*[:\s]+(\d{2}[/-]\d{2}[/-]\d{4})/i) ||
    cleanedText.match(/(\d{2}[/-]\d{2}[/-]\d{4})\s+\d{2}[:;]\d{2}[:;]\d{2}/);

  if (dateMatch) {
    let rawDate = dateMatch[1];

    // Year correction: OCR misreads '2' as '0' in thermal fonts e.g. 2006 → 2026
    rawDate = rawDate.replace(
      /(\d{2}[/-]\d{2}[/-])(20)(\d{2})/,
      (_, prefix, century, yy) => `${prefix}${century}${yy.replace(/^0/, "2")}`
    );

    timePaidDate = formatDateMmDdYyyy(rawDate);
  }

  const amountMatch =
    cleanedText.match(/t[o0]tal\s*am[o0]unt.*?(\d+\.\d{2})/i) ||
    cleanedText.match(/am[o0]unt\s*due.*?(\d+\.\d{2})/i) ||
    cleanedText.match(/(\d+\.\d{2})\s*$/m);

  if (amountMatch) {
    totalAmountDue = amountMatch[1].split(".")[0];
  }

  return { timePaidDate, totalAmountDue };
}

export function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

export function cropDataUrl(img, bbox, pad = 10) {
  const x0 = Math.max(0, Math.floor(bbox.x0 - pad));
  const y0 = Math.max(0, Math.floor(bbox.y0 - pad));
  const x1 = Math.min(img.width, Math.ceil(bbox.x1 + pad));
  const y1 = Math.min(img.height, Math.ceil(bbox.y1 + pad));

  const w = Math.max(1, x1 - x0);
  const h = Math.max(1, y1 - y0);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, x0, y0, w, h, 0, 0, w, h);
  return canvas.toDataURL("image/png");
}

export function groupWordsByLine(words) {
  const lines = [];
  const withBoxes = words.filter((w) => w.text && w.bbox);

  withBoxes.sort((a, b) => {
    const ay = a.bbox?.y0 ?? 0;
    const by = b.bbox?.y0 ?? 0;
    return ay - by;
  });

  for (const w of withBoxes) {
    const box = w.bbox;
    if (!box) continue;
    const cy = (box.y0 + box.y1) / 2;
    const height = Math.max(1, box.y1 - box.y0);
    const tol = Math.max(8, height * 0.6);

    let line = lines.find((l) => Math.abs(cy - l.cy) <= Math.max(l.tol, tol));
    if (!line) {
      line = {
        words: [],
        text: "",
        x0: box.x0,
        y0: box.y0,
        x1: box.x1,
        y1: box.y1,
        cy,
        tol,
      };
      lines.push(line);
    }

    line.words.push(w);
    line.text = line.words.map((ww) => ww.text).join(" ");
    line.x0 = Math.min(line.x0, box.x0);
    line.y0 = Math.min(line.y0, box.y0);
    line.x1 = Math.max(line.x1, box.x1);
    line.y1 = Math.max(line.y1, box.y1);
    line.cy = (line.cy + cy) / 2;
    line.tol = Math.max(line.tol, tol);
  }

  return lines;
}

export function findLineBBox(lines, requiredRegexes, fallbackRegex) {
  let best = null;
  for (const line of lines) {
    const text = line.text || "";
    const matchesRequired = requiredRegexes.every((re) => re.test(text));
    const matchesFallback = fallbackRegex ? fallbackRegex.test(text) : false;
    if (matchesRequired || matchesFallback) {
      if (!best || text.length > best.text.length) {
        best = { ...line, text };
      }
    }
  }
  return best ? { x0: best.x0, y0: best.y0, x1: best.x1, y1: best.y1 } : null;
}
