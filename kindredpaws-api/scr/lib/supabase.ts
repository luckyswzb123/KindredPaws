import { createClient } from '@supabase/supabase-js';

/**
 * 💡 重要说明：
 * 在 Cloudflare Workers 环境中，我们不再手动调用 dotenv.config()。
 * 环境变量会通过 index.ts 中的 globalThis.process.env 逻辑自动注入。
 */

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

// 这里的校验逻辑保留，但它现在会检查 Cloudflare 注入的环境变量
if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
}

// Service role client - 用于绕过 RLS 的服务端操作
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Anon client - 用于验证用户 Token
export const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

export { supabaseUrl, supabaseAnonKey };
