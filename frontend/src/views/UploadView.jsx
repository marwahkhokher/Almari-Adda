import { useEffect, useRef, useState } from "react";
import { uploadItem } from "../api";
import { useCatalogue } from "../store/CatalogueContext";
import { useToast } from "../components/Toast";
import { confidencePct, titleCase } from "../lib/format";

export default function UploadView({ onDone }) {
  const { refresh } = useCatalogue();
  const toast = useToast();

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | uploading | done
  const [result, setResult] = useState(null);
  const [camOn, setCamOn] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  // Keep the object URL preview in sync and revoke it on change/unmount.
  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => () => stopCamera(), []);

  function pickFile(f) {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast("Please choose an image file.", "error");
      return;
    }
    setResult(null);
    setStatus("idle");
    setFile(f);
    stopCamera();
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      setCamOn(true);
      // Wait a tick for the <video> to mount before attaching the stream.
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      });
    } catch {
      toast("Couldn't access the camera. Check browser permissions.", "error");
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCamOn(false);
  }

  function capture() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 720;
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (blob) {
          pickFile(new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" }));
        }
      },
      "image/jpeg",
      0.92,
    );
  }

  async function submit() {
    if (!file) return;
    setStatus("uploading");
    try {
      const res = await uploadItem(file);
      setResult(res);
      setStatus("done");
      toast("Item added to your closet!", "success");
      await refresh();
    } catch (err) {
      setStatus("idle");
      toast(err.message || "Upload failed", "error");
    }
  }

  function reset() {
    setFile(null);
    setResult(null);
    setStatus("idle");
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="font-display text-2xl font-bold">Add an item</h2>
      <p className="mt-1 text-sm text-ink/60">
        Take or upload a photo. We remove the background and auto-tag the
        category with AI.
      </p>

      {/* Result state */}
      {status === "done" && result ? (
        <ResultPanel result={result} onAgain={reset} onDone={onDone} />
      ) : (
        <div className="mt-6 space-y-4">
          {/* Camera live view */}
          {camOn && (
            <div className="overflow-hidden rounded-2xl border border-sand bg-black">
              <video
                ref={videoRef}
                playsInline
                muted
                className="max-h-[60vh] w-full object-contain"
              />
              <div className="flex justify-center gap-3 bg-ink/90 p-3">
                <button
                  onClick={capture}
                  className="rounded-full bg-white px-5 py-2 text-sm font-medium text-ink"
                >
                  ● Capture
                </button>
                <button
                  onClick={stopCamera}
                  className="rounded-full border border-white/40 px-4 py-2 text-sm text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Dropzone / preview */}
          {!camOn && (
            <label
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                pickFile(e.dataTransfer.files?.[0]);
              }}
              className="checker flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-sand p-6 text-center transition hover:border-clay"
            >
              {preview ? (
                <img
                  src={preview}
                  alt="Selected preview"
                  className="max-h-[46vh] rounded-lg object-contain"
                />
              ) : (
                <div className="text-ink/60">
                  <div className="text-4xl">📸</div>
                  <p className="mt-2 text-sm font-medium">
                    Drop an image, or click to browse
                  </p>
                  <p className="text-xs text-ink/40">PNG or JPG</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => pickFile(e.target.files?.[0])}
              />
            </label>
          )}

          <div className="flex flex-wrap items-center gap-3">
            {!camOn && (
              <button
                onClick={startCamera}
                className="rounded-full border border-sand bg-white px-4 py-2 text-sm hover:bg-sand"
              >
                📷 Use camera
              </button>
            )}
            {file && (
              <button
                onClick={reset}
                className="rounded-full border border-sand bg-white px-4 py-2 text-sm hover:bg-sand"
              >
                Clear
              </button>
            )}
            <div className="flex-1" />
            <button
              disabled={!file || status === "uploading"}
              onClick={submit}
              className="rounded-full bg-clay px-6 py-2 text-sm font-medium text-white transition enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {status === "uploading" ? "Processing…" : "Upload & tag"}
            </button>
          </div>

          {status === "uploading" && (
            <p className="text-center text-xs text-ink/50">
              Running background removal + classification — this can take a few
              seconds.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function ResultPanel({ result, onAgain, onDone }) {
  const item = result.item || {};
  const preds = result.all_predictions || [];
  return (
    <div className="mt-6 animate-fade-in-up rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
      <div className="flex items-center gap-2 text-emerald-700">
        <span className="text-xl">✓</span>
        <h3 className="font-semibold">Tagged and saved</h3>
      </div>

      <div className="mt-4 flex flex-col gap-5 sm:flex-row">
        <div className="checker mx-auto w-40 shrink-0 overflow-hidden rounded-xl border border-sand bg-white">
          {item.image_url && (
            <img
              src={item.image_url}
              alt={item.subcategory || "item"}
              className="aspect-square w-full object-contain p-2"
            />
          )}
        </div>

        <div className="flex-1">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-ink/50">Category</dt>
            <dd className="font-medium">{titleCase(item.category) || "—"}</dd>
            <dt className="text-ink/50">Subcategory</dt>
            <dd className="font-medium">{titleCase(item.subcategory) || "—"}</dd>
            <dt className="text-ink/50">Confidence</dt>
            <dd className="font-medium">{confidencePct(item.confidence) || "—"}</dd>
          </dl>

          {preds.length > 0 && (
            <div className="mt-4">
              <p className="mb-1 text-xs font-medium text-ink/50">
                Top predictions
              </p>
              <div className="space-y-1">
                {preds.slice(0, 4).map((p, i) => {
                  const label = p.label || p.subcategory || p[0];
                  const score = p.score ?? p.confidence ?? p[1];
                  return (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="w-24 truncate text-ink/70">
                        {titleCase(label)}
                      </span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white">
                        <div
                          className="h-full bg-clay"
                          style={{ width: `${Math.round((Number(score) || 0) * 100)}%` }}
                        />
                      </div>
                      <span className="w-9 text-right text-ink/50">
                        {confidencePct(score) || ""}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 flex gap-3">
        <button
          onClick={onAgain}
          className="rounded-full border border-sand bg-white px-4 py-2 text-sm hover:bg-sand"
        >
          Add another
        </button>
        <button
          onClick={onDone}
          className="rounded-full bg-ink px-4 py-2 text-sm text-cream hover:opacity-90"
        >
          View closet →
        </button>
      </div>
    </div>
  );
}
