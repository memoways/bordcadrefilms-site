"use client";

import { useState } from "react";
import Image from "next/image";

type Props = {
  label: string;
  imageUrl: string;
  onImageUrlChange: (url: string) => void;
  onUploadStart?: () => void;
  onUploadEnd?: () => void;
  disabled?: boolean;
  placeholder?: string;
};

export default function ImageUploadField({
  label,
  imageUrl,
  onImageUrlChange,
  onUploadStart,
  onUploadEnd,
  disabled,
  placeholder = "Paste image URL or select a file",
}: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please select an image file");
      return;
    }

    setIsUploading(true);
    onUploadStart?.();
    setErrorMsg(null);

    try {
      // Upload to Airtable using the attachments API
      // For now, we'll show a message that direct upload isn't supported
      // Users should upload via Airtable directly or use a file hosting service
      const reader = new FileReader();
      reader.onload = (e) => {
        // Display preview and inform user
        setErrorMsg(
          "Direct file upload is not available. Images must be uploaded via Airtable attachments field. Copy the attachment URL below:"
        );
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setErrorMsg(`Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsUploading(false);
      onUploadEnd?.();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">{label}</label>

      {/* Preview */}
      {imageUrl && (
        <div className="relative w-full h-40 rounded-lg overflow-hidden bg-zinc-100 border border-zinc-200">
          <Image src={imageUrl} alt="Preview" fill className="object-cover" />
          <button
            type="button"
            onClick={() => onImageUrlChange("")}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {/* URL Input */}
      <div className="flex flex-col gap-1.5">
        <input
          type="url"
          value={imageUrl}
          onChange={(e) => onImageUrlChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled || isUploading}
          className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300 bg-white disabled:bg-zinc-50 disabled:text-zinc-400 transition-colors"
        />
        <p className="text-xs text-zinc-400">
          Paste the Airtable attachment URL (from the image field in Airtable)
        </p>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
          isDragging
            ? "border-zinc-400 bg-zinc-50"
            : "border-zinc-200 hover:border-zinc-300 bg-white"
        } ${disabled || isUploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <label className="flex flex-col items-center gap-2 cursor-pointer">
          <svg className="w-6 h-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          <div>
            <p className="text-sm font-medium text-zinc-700">
              {isUploading ? "Uploading…" : "Drag image here or click to browse"}
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">PNG, JPG, GIF up to 10MB</p>
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.currentTarget.files?.[0];
              if (file) handleFileSelect(file);
            }}
            disabled={disabled || isUploading}
            className="hidden"
          />
        </label>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 space-y-1">
        <p className="font-semibold">📸 How to add images:</p>
        <ol className="list-decimal list-inside space-y-0.5">
          <li>
            Go to <span className="font-mono">Airtable → FestivalPhotos table → image field</span>
          </li>
          <li>Click the attachment area and upload your image</li>
          <li>Right-click the image → Copy attachment link</li>
          <li>Paste the URL above</li>
        </ol>
      </div>
    </div>
  );
}
