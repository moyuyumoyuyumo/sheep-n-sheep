// dev-server.js
// 极简本地静态文件服务器（替代 Live Server 扩展）。
// 用法：
//   npm start        ← 推荐
//   node dev-server.js
//
// 然后浏览器开 http://localhost:5500
// 按 Ctrl+C 停止。
//
// 为什么需要它？
//   index.html 用了 <script type="module">，浏览器要求模块文件
//   通过 HTTP 协议加载（不能用 file://）。所以必须跑个本地 server。
//
// 零依赖 —— 只用了 Node 自带的 http / fs 模块，不需要 npm install。

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, sep, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { networkInterfaces } from 'node:os';

const PORT = 5500;
const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)));

// 文件后缀 → MIME 类型。MIME 不对的话浏览器拒绝执行 JS。
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.mjs':  'text/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.ico':  'image/x-icon',
  '.txt':  'text/plain; charset=utf-8',
};

createServer(async (req, res) => {
  // 解析 URL：去掉 query string，根路径默认指向 index.html
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/' || urlPath === '') urlPath = '/index.html';

  // 把 URL 拼成磁盘路径，并防止路径穿越（../../etc/passwd 攻击）
  const filePath = normalize(join(ROOT, urlPath));
  if (!filePath.startsWith(ROOT + sep) && filePath !== ROOT) {
    res.writeHead(403);
    res.end('Forbidden');
    console.log(`  403  ${urlPath}`);
    return;
  }

  try {
    const content = await readFile(filePath);
    const mime = MIME[extname(filePath).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'no-store' });
    res.end(content);
    console.log(`  200  ${urlPath}`);
  } catch (err) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`Not found: ${urlPath}`);
    console.log(`  404  ${urlPath}`);
  }
}).listen(PORT, '0.0.0.0', () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  ▶ 咩了个咩 · 本地开发服务器');
  console.log(`  ▶ 本机访问     : http://localhost:${PORT}`);
  for (const ip of getLanIPv4()) {
    console.log(`  ▶ 同 WiFi 手机 : http://${ip}:${PORT}`);
  }
  console.log('  ▶ 按 Ctrl+C 停止');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});

/**
 * 拿到本机所有 IPv4（排掉 loopback / 虚拟网卡），
 * 让同 WiFi 下的手机能访问。
 * 过滤掉常见虚拟网卡名称（VMware / VirtualBox / WSL）避免干扰。
 */
function getLanIPv4() {
  const ips = [];
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    if (/vEthernet|VMware|VirtualBox|WSL|Loopback/i.test(name)) continue;
    for (const ni of nets[name] || []) {
      if (ni.family === 'IPv4' && !ni.internal) {
        ips.push(ni.address);
      }
    }
  }
  return ips;
}
