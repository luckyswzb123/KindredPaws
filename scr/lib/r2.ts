import { S3Client } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config();

console.log('[R2 Config Check]', {
  hasApiUrl: !!process.env.R2_S3_API_URL,
  accessKeyLen: process.env.R2_ACCESS_KEY_ID?.length || 0,
  secretKeyLen: process.env.R2_SECRET_ACCESS_KEY?.length || 0,
  bucketName: process.env.R2_BUCKET_NAME,
});

const r2 = new S3Client({
  region: 'us-east-1', // Try us-east-1 which is widely compatible
  endpoint: process.env.R2_S3_API_URL || '',
  credentials: {
    accessKeyId: (process.env.R2_ACCESS_KEY_ID || '').trim(),
    secretAccessKey: (process.env.R2_SECRET_ACCESS_KEY || '').trim(),
  },
  forcePathStyle: true, // Some R2 configurations require path style
});

export const BUCKET_NAME = process.env.R2_BUCKET_NAME || '';
export const PUBLIC_DOMAIN = process.env.R2_PUBLIC_DOMAIN || '';

export default r2;
