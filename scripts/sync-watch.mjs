/**
 * 主题源码热同步：watch theme/，变更即拷进宿主运行副本
 * （.sveltecms/data/themes/<name>/），宿主 vite 的 watcher 随即 HMR——改主题代码
 * → 浏览器秒级生效（布局、模板、loader 均随模块图热更）。
 *
 * 新增**文件**通常也能被 glob 收到（Vite 监视 glob 命中集）；但改主题目录名、
 * 或换 config.name 需重启 dev——宿主 glob 是编译期快照，旧目录会残留。
 */
import { watch, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'theme');

if (!existsSync(path.join(ROOT, '.sveltecms/package.json'))) {
	console.error('[watch] .sveltecms 不存在——先运行 pnpm dev / pnpm ensure');
	process.exit(1);
}

let timer = null;
let dirty = false;

function sync() {
	const r = spawnSync(process.execPath, [path.join(ROOT, 'scripts/ensure-host.mjs'), '--sync'], {
		stdio: ['ignore', 'ignore', 'inherit']
	});
	if (r.status !== 0) console.error('[watch] 同步失败（见上）');
	else if (dirty) console.log('[watch] 已同步 → .sveltecms/data/themes/');
	dirty = false;
}

// 编辑器保存常触发连串事件：200ms 去抖合并成一次全量同步（目录小，成本可忽略）
function schedule() {
	dirty = true;
	if (timer) clearTimeout(timer);
	timer = setTimeout(sync, 200);
}

watch(SRC, { recursive: true }, (_event, filename) => {
	if (!filename) return;
	const rel = filename.toString();
	// 测试不进宿主，无需为其变更触发同步
	if (/\.test\.ts$/.test(rel)) return;
	schedule();
});

console.log('[watch] 监听 theme/ → .sveltecms/data/themes/（Ctrl+C 退出）');
