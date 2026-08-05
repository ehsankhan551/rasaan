"use client";

import { useRef, useState } from "react";

// Reusable file input for plain <form action> submissions (server actions)
// that adds drag-and-drop on top of the normal click-to-browse control.
// Dropped files are attached to the underlying <input type="file"> via the
// DataTransfer API, so the surrounding <form> keeps working exactly as before.
export default function PhotoDropInput({ name = "image" }: { name?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState("");

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && inputRef.current) {
      const dt = new DataTransfer();
      dt.items.add(file);
      inputRef.current.files = dt.files;
      setFileName(file.name);
    }
  }

  return (
    <div>
      <label className="block text-xs font-medium mb-1">Photo</label>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`rounded-lg border-2 border-dashed px-2 py-1.5 transition-colors ${
          dragOver ? "border-green-500 bg-green-50" : "border-gray-300"
        }`}
      >
        <input
          ref={inputRef}
          name={name}
          type="file"
          accept="image/*"
          onChange={(e) => setFileName(e.target.files?.[0]?.name || "")}
          className="w-full text-xs file:mr-2 file:rounded-md file:border-0 file:bg-green-700 file:text-white file:px-2 file:py-1 file:text-xs"
        />
        <p className="text-[10px] text-gray-400 mt-0.5 truncate">{fileName || "Drag & drop an image, or click to browse"}</p>
      </div>
    </div>
  );
}
