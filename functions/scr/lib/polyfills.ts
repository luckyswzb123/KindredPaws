/**
 * ⚡️ 极速修复方案：Cloudflare Pages 专用 polyfill
 * 这段代码必须在所有其他 import 之前加载，以防止库在加载阶段访问 process 失败。
 */

// @ts-ignore
const global = globalThis;

if (!global.process) {
    global.process = {
        env: {},
        version: 'v18.0.0', // 伪装成 Node 环境，欺骗某些库
        nextTick: (fn, ...args) => setTimeout(() => fn(...args), 0),
        on: () => {},
        once: () => {},
        off: () => {},
        emit: () => {},
        cwd: () => '/',
        platform: 'browser'
    };
}

export default global.process;
