import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { env } from '../config/env.js';
import { ValidationError } from './errors.js';

// In production (Vercel), we must use /tmp because the rest of the filesystem is read-only
const isProd = env.NODE_ENV === 'production';
const uploadDir = isProd ? path.join('/tmp', env.UPLOAD_DIR) : path.resolve(env.UPLOAD_DIR);

try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (error) {
  console.warn(`[WARN] Failed to create upload directory at ${uploadDir}. Uploads may fail.`, error);
}

// Allowed MIME types
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

// Max file size in bytes
const MAX_SIZE = env.MAX_FILE_SIZE_MB * 1024 * 1024;

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    // Generate unique filename: timestamp-randomhex.ext
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    cb(null, uniqueName);
  },
});

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ValidationError(`Tipe file tidak diperbolehkan: ${file.mimetype}. Gunakan JPEG, PNG, atau WebP.`));
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: MAX_SIZE,
    files: 1,
  },
  fileFilter,
});

/**
 * Delete a previously uploaded file by its filename.
 */
export function deleteUploadedFile(filename: string): void {
  const filePath = path.join(uploadDir, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

/**
 * Validate file signature bytes (Magic Numbers) to ensure the file is a real image.
 * Supports JPEG, PNG, and WebP.
 */
export function validateImageSignature(filePath: string): boolean {
  try {
    if (!fs.existsSync(filePath)) return false;
    const buffer = Buffer.alloc(12);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 12, 0);
    fs.closeSync(fd);

    // Convert first 4 and 3 bytes to hex strings
    const hex4 = buffer.subarray(0, 4).toString('hex').toUpperCase();
    const hex3 = buffer.subarray(0, 3).toString('hex').toUpperCase();

    // JPEG: FF D8 FF
    if (hex3 === 'FFD8FF') {
      return true;
    }

    // PNG: 89 50 4E 47
    if (hex4 === '89504E47') {
      return true;
    }

    // WebP: RIFF (first 4 bytes: 52 49 46 46) and WEBP (bytes 8-11: 57 45 42 50)
    const riff = buffer.subarray(0, 4).toString('utf-8');
    const webp = buffer.subarray(8, 12).toString('utf-8');
    if (riff === 'RIFF' && webp === 'WEBP') {
      return true;
    }

    return false;
  } catch (error) {
    console.error('[Signature Validation Error]', error);
    return false;
  }
}
