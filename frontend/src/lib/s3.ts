import { S3Client } from '@aws-sdk/client-s3';

export const s3Client = new S3Client({
  region: 'us-east-1', // Supabase S3 gateway defaults to us-east-1
  endpoint: process.env.S3_ENDPOINT, // e.g. https://<project-id>.supabase.co/storage/v1/s3
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
  },
  forcePathStyle: true, // Required for Supabase S3 compatible gateway
});

export const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'games';
