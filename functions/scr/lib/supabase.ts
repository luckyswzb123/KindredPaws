import { createClient } from '@supabase/supabase-js';

/**
 * 💡 重要说明：
 * 在 Cloudflare Workers 环境中，我们不再手动调用 dotenv.config()。
 * 环境变量会通过 index.ts 中的 globalThis.process.env 逻辑自动注入。
 */

let _adminClient: any = null;
let _anonClient: any = null;

// Service role client - 用于绕过 RLS 的服务端操作
export const supabaseAdmin: any = new Proxy({}, {
  get(target, prop) {
    if (!_adminClient) {
      const url = process.env.SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!url || !key) {
        console.error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing in process.env');
        throw new Error('Supabase configuration missing');
      }
      _adminClient = createClient(url, key, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    }
    return _adminClient[prop];
  }
});

// Anon client - 用于验证用户 Token
export const supabaseAnon: any = new Proxy({}, {
  get(target, prop) {
    if (!_anonClient) {
      const url = process.env.SUPABASE_URL;
      const key = process.env.SUPABASE_ANON_KEY;
      if (!url || !key) {
        throw new Error('SUPABASE_URL or SUPABASE_ANON_KEY is missing');
      }
      _anonClient = createClient(url, key);
    }
    return _anonClient[prop];
  }
});

export const supabaseUrl = process.env.SUPABASE_URL;
export const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
