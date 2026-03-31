import { Hono } from 'hono';

// 注意：Hono 环境下不再需要 multer 和 AWS SDK
const router = new Hono();

// POST /api/admin/upload
router.post('/', async (c) => {
  try {
    // 1. 获取上传的文件 (Hono 原生解析，替代 multer)
    const body = await c.req.parseBody();
    const file = body.file as File;

    if (!file) {
      return c.json({ success: false, error: '未检出上传文件' }, 400);
    }

    // 2. 生成唯一文件名 (使用 Web 标准的 crypto)
    const fileExtension = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExtension}`;

    console.log(`[R2] 正在上传 ${fileName} 到存储桶...`);

    /** 
     * 3. 【核心修改】直接使用 R2 绑定写入
     * c.env.MY_BUCKET 对应你 wrangler.toml 里的 binding 名
     */
    await c.env.MY_BUCKET.put(fileName, file, {
      httpMetadata: {
        contentType: file.type
      }
    });

    console.log('[R2] 上传成功');

    // 4. 拼接公共访问链接
    // R2_PUBLIC_DOMAIN 建议在 wrangler.toml 的 [vars] 中定义
    const fileUrl = `${c.env.R2_PUBLIC_DOMAIN}/${fileName}`;

    return c.json({
      success: true,
      data: {
        url: fileUrl,
      },
    });
  } catch (err: any) {
    console.error('R2 上传错误详情:', err);
    return c.json({
      success: false,
      error: `图片存储失败: ${err.message}`
    }, 500);
  }
});

export default router;
