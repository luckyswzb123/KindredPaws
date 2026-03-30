import { Router, Request, Response } from 'express';
import multer from 'multer';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import r2, { BUCKET_NAME, PUBLIC_DOMAIN } from '../lib/r2.js';
import crypto from 'crypto';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: '未检出上传文件' });
  }

  const fileExtension = req.file.originalname.split('.').pop();
  const fileName = `${crypto.randomUUID()}.${fileExtension}`;

  try {
    console.log(`[R2] Attempting to upload ${fileName} to bucket ${BUCKET_NAME}...`);

    const uploadCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    });

    const result = await r2.send(uploadCommand);
    console.log('[R2] Upload successful:', result);

    const fileUrl = `${PUBLIC_DOMAIN}/${fileName}`;

    return res.json({
      success: true,
      data: {
        url: fileUrl,
      },
    });
  } catch (err: any) {
    console.error('R2 Upload Error Details:', {
      message: err.message,
      code: err.code,
      requestId: err.$metadata?.requestId,
      stack: err.stack,
    });
    return res.status(500).json({ success: false, error: `图片存储失败: ${err.message}` });
  }
});

export default router;
