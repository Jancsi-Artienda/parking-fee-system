import { useState, useEffect, useRef, useCallback } from "react";
import dayjs from "dayjs";
import { createWorker } from "tesseract.js";
import {
  X, ScanLine, Upload, Camera, CheckCircle2, AlertCircle,
  RotateCcw, FileImage, Loader2, CalendarDays, PhilippinePeso,
  ArrowRight, Car,
} from "lucide-react";

import { preprocessImage } from "../../utils/imagePreprocess";

// ── Date helpers ─────────────────────────────────────────────────────────────
function formatDateMmDdYyyy(input) {
  if (!input) return "";
  const [mm, dd, yyyy] = input.split(/[./-]/).map((v) => v.trim());
  if (!mm || !dd || !yyyy) return "";
  const month = mm.padStart(2, "0");
  const day = dd.padStart(2, "0");
  const year = yyyy.length === 2 ? `20${yyyy}` : yyyy;
  return `${year}-${month}-${day}`; // Return YYYY-MM-DD for dayjs compatibility
}

// ── Ticket parser ─────────────────────────────────────────────────────────────
function parseTicket(text) {
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
    text.match(/T[I1]ME\s*PA[I1]D\s*[:\s]+(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i) ||
    cleanedText.match(/T[I1]ME\s*PA[I1]D\s*[:\s]+(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i) ||
    cleanedText.match(/(\d{2}[\/\-]\d{2}[\/\-]\d{4})\s+\d{2}[:\;]\d{2}[:\;]\d{2}/);

  if (dateMatch) {
    let rawDate = dateMatch[1];

    // Year correction: OCR misreads '2' as '0' in thermal fonts e.g. 2006 → 2026
    rawDate = rawDate.replace(
      /(\d{2}[\/\-]\d{2}[\/\-])(20)(\d{2})/,
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

function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

function cropDataUrl(img, bbox, pad = 10) {
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

function groupWordsByLine(words) {
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

function findLineBBox(lines, requiredRegexes, fallbackRegex) {
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

// ── Component ─────────────────────────────────────────────────────────────────
export default function ReceiptScannerModal({
  open,
  setOpen,
  vehicles,
  onAddReport,
  existingReports = [],
  coverageFrom,
  coverageTo,
}) {
  const [step, setStep] = useState("capture");
  const [imagePreview, setImagePreview] = useState(null);
  const [extractedDate, setExtractedDate] = useState("");
  const [extractedAmount, setExtractedAmount] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [scanError, setScanError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [scanProgress, setScanProgress] = useState(0);
  const [scanConfidence, setScanConfidence] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [scanAttempts, setScanAttempts] = useState(0);
  // Camera state
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const workerRef = useRef(null);

  const coverageStart = coverageFrom && dayjs(coverageFrom).isValid() ? dayjs(coverageFrom) : null;
  const coverageEnd = coverageTo && dayjs(coverageTo).isValid() ? dayjs(coverageTo) : null;
  const minDate = coverageStart ? coverageStart.format("YYYY-MM-DD") : undefined;
  const maxDate = coverageEnd ? coverageEnd.format("YYYY-MM-DD") : undefined;

  const safeVehicles = Array.isArray(vehicles) ? vehicles : [];
  const hasSingleVehicle = safeVehicles.length === 1;
  const singleVehicle = hasSingleVehicle ? safeVehicles[0] : null;

  // Reset on open/close
  useEffect(() => {
    if (open) {
      setStep("capture");
      setImagePreview(null);
      setExtractedDate(dayjs().format("YYYY-MM-DD"));
      setExtractedAmount("");
      if (hasSingleVehicle && singleVehicle?.id != null) {
        setVehicleId(String(singleVehicle.id));
      } else {
        setVehicleId("");
      }
      setScanError("");
      setSaveError("");
      setScanProgress(0);
      setScanConfidence(null);
      setCameraActive(false);
      setMounted(true);
    } else {
      setMounted(false);
      stopCamera();
    }
  }, [open, hasSingleVehicle, singleVehicle]);

  // Terminate Tesseract worker on unmount
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  // ── Camera helpers ──────────────────────────────────────────────────────────
  // FIX: Assign srcObject AFTER cameraActive=true renders the <video> into the DOM
  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraActive]);

  const startCamera = async () => {
    setScanError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
      });
      streamRef.current = stream;
      setCameraActive(true); // <video> renders → useEffect above assigns srcObject
    } catch {
      setScanError("Camera access denied. Please allow camera permissions or upload an image instead.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const captureFromCamera = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d").drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setImagePreview(dataUrl);
    stopCamera();
    runScan(dataUrl, true);
  };

  // ── File upload ─────────────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanError("");
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      setImagePreview(dataUrl);
      stopCamera();
      runScan(dataUrl, false);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // ── Drag & drop ─────────────────────────────────────────────────────────────
  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    handleFileChange({ target: { files: [file], value: "" } });
  };

  // ── Main scan: preprocess → OCR → parse ────────────────────────────────────
  // Worker is created fresh every scan and terminated in finally —
  // reusing the same worker causes Tesseract to "learn" across different
  // receipts and produce worse results over time (documented v6+ behaviour)
  const runScan = useCallback(async (dataUrl) => {
    setStep("scanning");
    setScanError("");
    setScanProgress(0);

    let worker = null;
    try {
      // Pass 1: legacy-style preprocessing (no exposure normalization) for well-taken shots
      const processedUrl = await preprocessImage(dataUrl, { binarize: true, normalizeExposureEnabled: false });
      const processedImg = await loadImage(processedUrl);

      worker = await createWorker("eng", 1, {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setScanProgress(Math.round(m.progress * 100));
          }
        },
      });

      await worker.setParameters({
        tessedit_pageseg_mode: 4,
        preserve_interword_spaces: 1,
        tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789:./- ",
      });

      const { data } = await worker.recognize(processedUrl);
      const rawText = data.text.trim();

      // 3. Parse date and amount
      let { timePaidDate, totalAmountDue } = parseTicket(rawText);
      let lineWords = Array.isArray(data.words) ? data.words : null;
      let lineImage = processedImg;

      // 3b. If missing fields, try raw image OCR (best for well-taken shots)
      if (!timePaidDate || !totalAmountDue) {
        const rawResult = await worker.recognize(dataUrl);
        const rawText = rawResult.data.text.trim();
        const parsedRaw = parseTicket(rawText);
        timePaidDate = timePaidDate || parsedRaw.timePaidDate;
        totalAmountDue = totalAmountDue || parsedRaw.totalAmountDue;
        lineWords = Array.isArray(rawResult.data.words) ? rawResult.data.words : lineWords;
        lineImage = (await loadImage(dataUrl)) || lineImage;
      }

      // 3c. If still missing, run exposure-normalized grayscale for tough lighting
      if (!timePaidDate || !totalAmountDue) {
        const processedGrayUrl = await preprocessImage(dataUrl, { binarize: false, normalizeExposureEnabled: true });
        const processedGrayImg = await loadImage(processedGrayUrl);
        const grayResult = await worker.recognize(processedGrayUrl);
        const grayText = grayResult.data.text.trim();
        const parsedGray = parseTicket(grayText);
        timePaidDate = timePaidDate || parsedGray.timePaidDate;
        totalAmountDue = totalAmountDue || parsedGray.totalAmountDue;
        lineWords = Array.isArray(grayResult.data.words) ? grayResult.data.words : lineWords;
        lineImage = processedGrayImg || lineImage;
      }

      // 3d. Targeted line OCR for TIME PAID / TOTAL AMOUNT if still missing
      if ((!timePaidDate || !totalAmountDue) && Array.isArray(lineWords)) {
        const lines = groupWordsByLine(lineWords);

        if (!timePaidDate) {
          const timeBBox = findLineBBox(lines, [/time/i, /paid/i], /t[i1]me\s*pa[i1]d/i);
          if (timeBBox) {
            const timeCrop = cropDataUrl(lineImage, timeBBox, 12);
            await worker.setParameters({
              tessedit_pageseg_mode: 7,
              preserve_interword_spaces: 1,
              tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789:./- ",
            });
            const timeResult = await worker.recognize(timeCrop);
            const parsed = parseTicket(timeResult.data.text.trim());
            if (parsed.timePaidDate) {
              timePaidDate = parsed.timePaidDate;
            }
          }
        }

        if (!totalAmountDue) {
          const amountBBox = findLineBBox(
            lines,
            [/t[o0]tal/i, /am[o0]unt/i],
            /am[o0]unt\s*due/i
          );
          if (amountBBox) {
            const amountCrop = cropDataUrl(lineImage, amountBBox, 12);
            await worker.setParameters({
              tessedit_pageseg_mode: 7,
              preserve_interword_spaces: 1,
              tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789:./- ",
            });
            const amountResult = await worker.recognize(amountCrop);
            const parsed = parseTicket(amountResult.data.text.trim());
            if (parsed.totalAmountDue) {
              totalAmountDue = parsed.totalAmountDue;
            }
          }
        }
      }

      // CHECK FOR SUCCESS
      if (!timePaidDate && !totalAmountDue) {
        const nextAttempt = scanAttempts + 1;
        setScanAttempts(nextAttempt);

        if (nextAttempt >= 3) {
          // After 3 failed attempts, force them to review/manual entry
          setScanError("Multiple failed attempts. Please fill in details manually.");
          setScanAttempts(0); // Reset counter for next time
          setStep("review");
        } else {
          // Not enough data found, go back to capture to try again
          setStep("capture");
          setImagePreview(null);
        }
        return;
      }

      // SUCCESS: Clear attempts and move to review
      setScanAttempts(0);
      setExtractedDate(timePaidDate && dayjs(timePaidDate).isValid() ? timePaidDate : dayjs().format("YYYY-MM-DD"));
      setExtractedAmount(totalAmountDue || "");
      setScanConfidence(Math.round(data.confidence));
      setStep("review");

    } catch (err) {
      setScanError("Scan failed. Please try again or enter manually.");
      setStep("review");
    } finally {
      if (worker) {
        await worker.terminate();
      }
    }
  }, [scanAttempts]); // Add scanAttempts to dependencies

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaveError("");
    if (!vehicleId) { setSaveError("Please select a vehicle."); return; }
    if (!extractedAmount || isNaN(Number(extractedAmount)) || Number(extractedAmount) <= 0) {
      setSaveError("Enter a valid amount."); return;
    }
    if (!extractedDate || !dayjs(extractedDate).isValid()) {
      setSaveError("Enter a valid transaction date."); return;
    }

    const existing = new Set(
      existingReports.map((r) =>
        dayjs(r.transDate).isValid() ? dayjs(r.transDate).format("YYYY-MM-DD") : ""
      )
    );
    if (existing.has(extractedDate)) {
      setSaveError(`A report for ${extractedDate} already exists.`); return;
    }

    setStep("saving");
    try {
      await onAddReport({
        transDates: [extractedDate],
        vehicleId: Number(vehicleId),
        amount: Number(extractedAmount),
      });
      setStep("done");
      setTimeout(() => setOpen(false), 1400);
    } catch (err) {
      setSaveError(err?.message || "Failed to save report.");
      setStep("review");
    }
  };

  const resetToCapture = () => {
    setStep("capture");
    setImagePreview(null);
    setScanError("");
    setSaveError("");
    setScanProgress(0);
    setScanConfidence(null);
    stopCamera();
  };

  if (!open) return null;

  const coverageLabel =
    coverageStart && coverageEnd
      ? `${coverageStart.format("MMM D, YYYY")} — ${coverageEnd.format("MMM D, YYYY")}`
      : "No coverage set";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        style={{ animation: mounted ? "fadeIn 0.18s ease" : undefined }}
        onClick={() => step !== "scanning" && step !== "saving" && setOpen(false)}
      />

      {/* Modal wrapper */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ pointerEvents: "none" }}>
        <div
          className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
          style={{
            pointerEvents: "all",
            animation: mounted ? "slideUp 0.22s cubic-bezier(0.34,1.56,0.64,1)" : undefined,
          }}
        >
          {/* Accent bar */}
          <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-cyan-400 to-teal-400" />

          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <ScanLine size={17} className="text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Receipt Scanner</h3>
                <p className="text-xs text-gray-400">
                  {step === "capture" && "Upload or take a photo of your receipt"}
                  {step === "scanning" && "Reading receipt…"}
                  {step === "review" && "Review extracted data"}
                  {step === "saving" && "Saving entry…"}
                  {step === "done" && "Entry saved!"}
                </p>
              </div>
            </div>
            <button
              onClick={() => step !== "scanning" && step !== "saving" && setOpen(false)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors disabled:opacity-40"
              disabled={step === "scanning" || step === "saving"}
            >
              <X size={15} />
            </button>
          </div>

          {/* Coverage badge */}
          <div className="mx-5 mt-4 flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-100">
            <CalendarDays size={13} className="text-blue-500 shrink-0" />
            <span className="text-xs text-blue-700 font-medium">Coverage:&nbsp;</span>
            <span className="text-xs text-blue-600">{coverageLabel}</span>
          </div>

          {/* ── STEP: CAPTURE ─────────────────────────────────────────────── */}
          {step === "capture" && (
            <div className="px-5 py-4 space-y-3">
              {scanAttempts > 0 && (
                <div className="flex items-center justify-between px-3 py-2 bg-amber-50 rounded-lg border border-amber-200 mb-1">
                  <div className="flex items-center gap-2">
                    <RotateCcw size={12} className="text-amber-600" />
                    <span className="text-xs font-medium text-amber-700">Scan Attempt {scanAttempts}/3</span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`w-4 h-1.5 rounded-full transition-colors duration-300 ${i <= scanAttempts ? 'bg-amber-500' : 'bg-gray-200'}`}
                      />
                    ))}
                  </div>
                </div>
              )}
              {cameraActive ? (
                <div className="relative rounded-xl overflow-hidden bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full max-h-56 object-cover"
                  />
                  {/* Scan overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-64 border-2 border-white/70 rounded-lg relative">
                      <span className="absolute -top-px left-0 w-6 h-0.5 bg-cyan-400" />
                      <span className="absolute -top-px right-0 w-6 h-0.5 bg-cyan-400" />
                      <span className="absolute -bottom-px left-0 w-6 h-0.5 bg-cyan-400" />
                      <span className="absolute -bottom-px right-0 w-6 h-0.5 bg-cyan-400" />
                      <span className="absolute top-0 -left-px h-6 w-0.5 bg-cyan-400" />
                      <span className="absolute bottom-0 -left-px h-6 w-0.5 bg-cyan-400" />
                      <span className="absolute top-0 -right-px h-6 w-0.5 bg-cyan-400" />
                      <span className="absolute bottom-0 -right-px h-6 w-0.5 bg-cyan-400" />
                    </div>
                  </div>
                  {/* Flatten tip */}
                  <div className="absolute top-0 inset-x-0 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-black/50">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                      <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Z" fill="#FCD34D" />
                      <path d="M8 4.75a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 4.75ZM8 11a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z" fill="#FCD34D" />
                    </svg>
                    <p className="text-xs text-yellow-200">Flatten receipt · one ticket only · fingers clear</p>
                  </div>

                  <div className="absolute bottom-0 inset-x-0 flex gap-2 p-3">
                    <button
                      onClick={stopCamera}
                      className="flex-1 py-2 text-xs font-medium text-white rounded-lg bg-[#E60000] hover:bg-[#cc0000] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={captureFromCamera}
                      className="flex-1 py-2 text-xs font-medium text-white rounded-lg bg-[#1a3a5c] hover:bg-[#142d47] transition-colors"
                    >
                      Capture
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Drop zone */}
                  <div
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => fileInputRef.current?.click()}
                    className="group border-2 border-dashed border-gray-200 hover:border-blue-300 rounded-xl p-6 flex flex-col items-center gap-2 cursor-pointer transition-colors bg-gray-50 hover:bg-blue-50/40"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center group-hover:scale-105 transition-transform">
                      <FileImage size={20} className="text-blue-500" />
                    </div>
                    <p className="text-sm font-medium text-gray-700">Upload receipt image</p>
                    <p className="text-xs text-gray-400">Drag & drop or click to browse · JPG, PNG, WEBP</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-gray-100" />
                    <span className="text-xs text-gray-400">or</span>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>

                  {/* Vehicle selector shown early */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      <Car size={12} className="inline mr-1 text-gray-400" />
                      Vehicle
                    </label>
                    {hasSingleVehicle ? (
                      <input
                        type="text"
                        readOnly
                        value={`${singleVehicle?.type || ""} - ${singleVehicle?.name || ""} (${singleVehicle?.plate || ""})`}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-700 cursor-not-allowed"
                      />
                    ) : (
                      <select
                        value={vehicleId}
                        onChange={(e) => setVehicleId(e.target.value)}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition"
                      >
                        <option value="" disabled>Select a vehicle</option>
                        {safeVehicles.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.type} - {v.name} ({v.plate})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Camera button */}
                  <button
                    onClick={startCamera}
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-blue-700 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors"
                  >
                    <Camera size={15} />
                    Take a photo
                  </button>
                </>
              )}

              {scanError && (
                <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 rounded-lg border border-red-100">
                  <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-red-600">{scanError}</p>
                </div>
              )}
            </div>
          )}

          {/* ── STEP: SCANNING ────────────────────────────────────────────── */}
          {step === "scanning" && (
            <div className="px-5 py-8 flex flex-col items-center gap-4">
              {imagePreview && (
                <div className="w-24 h-32 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                  <img src={imagePreview} alt="receipt" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex flex-col items-center gap-2">
                <Loader2 size={22} className="text-blue-500 animate-spin" />
                <p className="text-sm font-medium text-gray-700">Reading receipt…</p>
                <p className="text-xs text-gray-400">
                  {scanProgress > 0 ? `Recognising text… ${scanProgress}%` : "Preprocessing image…"}
                </p>
              </div>
              {/* Animated scan bar */}
              <div className="w-48 h-1 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full"
                  style={{ animation: "scanBar 1.4s ease-in-out infinite" }}
                />
              </div>
            </div>
          )}

          {/* ── STEP: REVIEW ──────────────────────────────────────────────── */}
          {step === "review" && (
            <div className="px-5 py-4 space-y-4">

              {/* Thumbnail + rescan */}
              {imagePreview && (
                <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="w-12 h-16 rounded-lg overflow-hidden border border-gray-200 shrink-0">
                    <img src={imagePreview} alt="receipt" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700 truncate">Receipt captured</p>
                    <p className="text-xs text-gray-400">Review and correct the fields below</p>
                  </div>
                  <button
                    onClick={resetToCapture}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
                    title="Scan again"
                  >
                    <RotateCcw size={13} />
                  </button>
                </div>
              )}

              {/* Scan warning if extraction had issues */}
              {scanError && (
                <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-50 rounded-lg border border-amber-100">
                  <AlertCircle size={14} className="text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-700">{scanError} Fill in manually below.</p>
                </div>
              )}

              {/* Low confidence warning */}
              {!scanError && scanConfidence !== null && scanConfidence < 70 && (
                <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-50 rounded-lg border border-amber-100">
                  <AlertCircle size={14} className="text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-amber-700">
                      Low scan confidence ({scanConfidence}%) — please verify the fields below.
                    </p>
                    <p className="text-xs text-amber-600 mt-0.5">
                      Try retaking with the receipt flat, well-lit, and fingers clear.
                    </p>
                  </div>
                </div>
              )}

              {/* Transaction Date */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  <CalendarDays size={12} className="inline mr-1 text-gray-400" />
                  Transaction Date
                </label>
                <input
                  type="date"
                  value={extractedDate}
                  min={minDate}
                  max={maxDate}
                  onChange={(e) => setExtractedDate(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  <PhilippinePeso size={12} className="inline mr-1 text-gray-400" />
                  Amount (PHP)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium select-none">₱</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={extractedAmount}
                    onChange={(e) => setExtractedAmount(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-lg pl-7 pr-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition"
                  />
                </div>
              </div>

              {/* Vehicle */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  <Car size={12} className="inline mr-1 text-gray-400" />
                  Vehicle
                </label>
                {hasSingleVehicle ? (
                  <input
                    type="text"
                    readOnly
                    value={`${singleVehicle?.type || ""} - ${singleVehicle?.name || ""} (${singleVehicle?.plate || ""})`}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-700 cursor-not-allowed"
                  />
                ) : (
                  <select
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition"
                  >
                    <option value="" disabled>Select a vehicle</option>
                    {safeVehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.type} - {v.name} ({v.plate})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Save error */}
              {saveError && (
                <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 rounded-lg border border-red-100">
                  <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-red-600">{saveError}</p>
                </div>
              )}
            </div>
          )}

          {/* ── STEP: DONE ────────────────────────────────────────────────── */}
          {(step === "saving" || step === "done") && (
            <div className="px-5 py-10 flex flex-col items-center gap-3">
              {step === "saving" ? (
                <>
                  <Loader2 size={22} className="text-blue-500 animate-spin" />
                  <p className="text-sm font-medium text-gray-700">Saving entry…</p>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
                    <CheckCircle2 size={24} className="text-green-500" />
                  </div>
                  <p className="text-sm font-semibold text-gray-800">Report saved!</p>
                  <p className="text-xs text-gray-400">Closing automatically…</p>
                </>
              )}
            </div>
          )}

          {/* Footer */}
          {(step === "capture" || step === "review") && (
            <div className="px-5 pb-5 flex gap-2">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 py-2 text-sm font-medium text-white rounded-xl bg-[#E60000] hover:bg-[#cc0000] transition-colors"
              >
                Cancel
              </button>
              {step === "review" && (
                <button
                  onClick={handleSave}
                  className="flex-1 py-2 text-sm font-medium text-white rounded-xl bg-[#1a3a5c] hover:bg-[#142d47] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                >
                  Confirm & Save
                  <ArrowRight size={14} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes scanBar {
          0%   { width: 0%;  margin-left: 0; }
          50%  { width: 60%; margin-left: 20%; }
          100% { width: 0%;  margin-left: 100%; }
        }
      `}</style>
    </>
  );
}
