/**
 * Image Compression Pipeline for Prescription Uploads
 * - Max 10MB after compression
 * - Quality reduction then resize if needed
 * - Supports JPEG, PNG (converts to JPEG for smaller size)
 */

import imageCompression from "browser-image-compression";

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

export interface CompressionError {
  type: "size" | "type" | "dimensions";
  message: string;
}

// Constraints from plan
const MAX_FILE_SIZE_MB = 10;
const INITIAL_COMPRESSION_THRESHOLD_MB = 2;
const QUALITY_COMPRESSION_THRESHOLD_MB = 5;
const MAX_DIMENSION = 4096;
const RESIZE_DIMENSION = 2048;

const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"];

/**
 * Validate file type
 */
export function validateFileType(file: File): CompressionError | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      type: "type",
      message: "Please upload a JPEG, PNG, or PDF file.",
    };
  }
  return null;
}

/**
 * Get image dimensions
 */
async function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Validate image dimensions
 */
export async function validateDimensions(
  file: File
): Promise<CompressionError | null> {
  if (file.type === "application/pdf") {
    return null; // PDFs don't have dimension limits in the same way
  }

  try {
    const { width, height } = await getImageDimensions(file);
    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      return {
        type: "dimensions",
        message: `Image is too large (${width}x${height}). Maximum allowed is ${MAX_DIMENSION}x${MAX_DIMENSION}.`,
      };
    }
    return null;
  } catch {
    return null; // If we can't read dimensions, let the upload proceed
  }
}

/**
 * Compress image file following the pipeline:
 * 1. If > 2MB, compress to 80% quality
 * 2. If still > 5MB, resize to max 2048px width
 * 3. If still > 10MB, reject
 */
export async function compressImage(
  file: File,
  onProgress?: (progress: number) => void
): Promise<CompressionResult> {
  const originalSize = file.size;
  const sizeMB = originalSize / (1024 * 1024);

  // PDFs are not compressed
  if (file.type === "application/pdf") {
    if (sizeMB > MAX_FILE_SIZE_MB) {
      throw new Error(
        `PDF file is too large (${sizeMB.toFixed(1)}MB). Maximum size is ${MAX_FILE_SIZE_MB}MB.`
      );
    }
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 1,
    };
  }

  // Small files don't need compression
  if (sizeMB <= INITIAL_COMPRESSION_THRESHOLD_MB) {
    onProgress?.(100);
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 1,
    };
  }

  let currentFile = file;
  let compressionStep = 0;

  // Step 1: Quality compression (80%)
  if (sizeMB > INITIAL_COMPRESSION_THRESHOLD_MB) {
    onProgress?.(20);
    currentFile = await imageCompression(currentFile, {
      maxSizeMB: QUALITY_COMPRESSION_THRESHOLD_MB,
      initialQuality: 0.8,
      useWebWorker: true,
      onProgress: (progress) => {
        onProgress?.(20 + progress * 0.4);
      },
    });
    compressionStep = 1;
  }

  // Step 2: Resize if still too large
  const newSizeMB = currentFile.size / (1024 * 1024);
  if (newSizeMB > QUALITY_COMPRESSION_THRESHOLD_MB) {
    onProgress?.(60);
    currentFile = await imageCompression(currentFile, {
      maxSizeMB: MAX_FILE_SIZE_MB,
      maxWidthOrHeight: RESIZE_DIMENSION,
      initialQuality: 0.75,
      useWebWorker: true,
      onProgress: (progress) => {
        onProgress?.(60 + progress * 0.3);
      },
    });
    compressionStep = 2;
  }

  // Final check
  const finalSizeMB = currentFile.size / (1024 * 1024);
  if (finalSizeMB > MAX_FILE_SIZE_MB) {
    throw new Error(
      `File is still too large after compression (${finalSizeMB.toFixed(1)}MB). ` +
      `Please use a smaller image or lower resolution.`
    );
  }

  onProgress?.(100);

  return {
    file: currentFile,
    originalSize,
    compressedSize: currentFile.size,
    compressionRatio: originalSize / currentFile.size,
  };
}

/**
 * Full validation and compression pipeline
 */
export async function processUploadFile(
  file: File,
  onProgress?: (progress: number) => void
): Promise<CompressionResult> {
  // Validate type
  const typeError = validateFileType(file);
  if (typeError) {
    throw new Error(typeError.message);
  }

  // Validate dimensions (for images)
  const dimensionError = await validateDimensions(file);
  if (dimensionError) {
    throw new Error(dimensionError.message);
  }

  // Compress
  return compressImage(file, onProgress);
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
