"use client";

import { useState, useRef } from "react";

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const data = result.split(",")[1];
      resolve({ mediaType: file.type, data, name: file.name });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function UploadPanel({ initialContent, onGenerate, generating, error }) {
  const [content, setContent] = useState(initialContent || "");
  const [images, setImages] = useState([]);
  const fileInputRef = useRef(null);

  async function handleFiles(e) {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter((f) => f.type.startsWith("image/"));
    const encoded = await Promise.all(imageFiles.map(fileToBase64));
    setImages((prev) => [...prev, ...encoded]);
    e.target.value = "";
  }

  function removeImage(idx) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }

  const canGenerate = (content.trim().length > 0 || images.length > 0) && !generating;

  return (
    <div className="card p-5 sm:p-6">
      <p className="eyebrow mb-3">source material</p>
      <textarea
        className="input min-h-[180px] resize-y font-body"
        placeholder="Paste your lecture notes here, or add slide photos/screenshots below…"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      <div className="flex flex-wrap gap-3 mt-3">
        {images.map((img, i) => (
          <div key={i} className="relative">
            <img
              src={`data:${img.mediaType};base64,${img.data}`}
              alt={img.name}
              className="w-16 h-16 object-cover rounded-md border border-line"
            />
            <button
              onClick={() => removeImage(i)}
              className="absolute -top-2 -right-2 bg-bad text-bg rounded-full w-5 h-5 text-xs leading-5"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="flex gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFiles}
          />
          <button className="btn btn-ghost text-sm" onClick={() => fileInputRef.current?.click()}>
            + Add slide image
          </button>
        </div>
        <button
          className="btn btn-primary"
          disabled={!canGenerate}
          onClick={() => onGenerate({ content, images })}
        >
          {generating ? "Generating…" : "Generate study material"}
        </button>
      </div>

      <p className="text-xs text-muted mt-3">
        Tip: for PowerPoint slides, export as images or PDF-to-image first — paste text notes work directly.
      </p>

      {error && <p className="text-sm text-bad mt-3">{error}</p>}
    </div>
  );
}
