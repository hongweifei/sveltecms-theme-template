/**
 * 打包发布 zip：theme/ 内容直接落 zip 根（宿主安装器约定——theme.config.ts 必须
 * 位于 zip 根目录，嵌套一层会被判 "Theme zip missing theme.config.ts" 并回滚）。
 *
 * 产出 dist/<name>-<version>.zip + 控制台打印 SHA-256。name/version 读
 * theme/theme.config.ts。
 *
 * 落地目录名由安装器按 config.name 归一（zip 文件名只是解析失败时的回退），
 * 所以打包方不必关心 zip 文件名——但 config.name 自身必须与你想发布的名字一致。
 */
import { createHash } from 'node:crypto';
import { readFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import AdmZip from 'adm-zip';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'theme');

const config = readFileSync(path.join(SRC, 'theme.config.ts'), 'utf8');
// 与 ensure-host.mjs 同口径：先锚定 export default，避免被前面的 props 类型截胡
const body = /export\s+default\s*\{/.exec(config)?.[0];
const after = body ? config.slice(config.indexOf(body)) : config;
const name = /\bname\s*:\s*(['"])([^'"]+)\1/.exec(after)?.[2];
const version = /\bversion\s*:\s*(['"])([^'"]+)\1/.exec(after)?.[2];
if (!name || !version) {
	console.error('[package] theme.config.ts 未找到 name/version 字段');
	process.exit(1);
}

const zip = new AdmZip();
// 发布包只含运行文件：测试排除（与 ensure-host sync 同口径）
zip.addLocalFolder(SRC, undefined, (srcPath) => !/\.test\.ts$/.test(srcPath.replaceAll('\\', '/')));
mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
const out = path.join(ROOT, 'dist', `${name}-${version}.zip`);
zip.writeZip(out);
const sha = createHash('sha256').update(zip.toBuffer()).digest('hex');

console.log(`[package] ${path.relative(ROOT, out)}`);
console.log(`[package] sha256=${sha}`);
