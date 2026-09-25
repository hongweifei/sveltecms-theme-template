/**
 * 一键改名：把模板标识符全量替换成你的主题名（照插件模板 rename 的做法）。
 *
 *   node scripts/rename.mjs aurora      # 例
 *
 * 覆盖的 token：
 *   my-theme                  → 你的 kebab 名（config.name；宿主据此决定落地目录名）
 *   My Theme                  → 英文显示名（config.label 的对照文案）
 *   sveltecms-theme-template  → package.json 的 npm 名（走 npm 包分发时才用到）
 *
 * 主题没有表前缀 / 集合 slug 那类派生标识符，所以插件模板里的 my_plugin
 * 下划线形态在这里没有对象，不搬过来（无消费者的替换只会制造误伤）。
 *
 * 不自动改的（猜错更糟，交给你）：中文文案与 label、icon、README 叙述、
 * 删用不到的示例模板。改完跑 pnpm test / pnpm check 确认。
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SELF = path.join(ROOT, 'scripts', 'rename.mjs');
const SKIP_DIRS = new Set(['node_modules', '.sveltecms', '.git', 'dist', '.svelte-kit']);
const EXT = /\.(ts|js|mjs|svelte|json|md|yml|yaml)$/;

const name = process.argv[2];
if (!name) {
	console.error('用法: node scripts/rename.mjs <kebab-name>   例: aurora');
	process.exit(1);
}
if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(name)) {
	console.error(`主题名需为 kebab-case（小写字母/数字，连字符分隔）：收到 "${name}"`);
	process.exit(1);
}
if (name === 'my-theme') {
	console.error('新主题名与模板默认名相同，无需改名。');
	process.exit(1);
}
if (name === 'default') {
	console.error('"default" 与宿主内置主题同名，换一个。');
	process.exit(1);
}

const title = name
	.split('-')
	.map((s) => s[0].toUpperCase() + s.slice(1))
	.join(' ');

// 裸子串、长先行：包名不含其余 token，序仅为稳
const PAIRS = [
	[/sveltecms-theme-template/g, `sveltecms-theme-${name}`],
	[/my-theme/g, name],
	[/My Theme/g, title]
];

function walk(dir) {
	const out = [];
	for (const entry of readdirSync(dir)) {
		const p = path.join(dir, entry);
		if (p === SELF) continue; // 本脚本自身含 token，跳过防自毁
		if (statSync(p).isDirectory()) {
			if (!SKIP_DIRS.has(entry)) out.push(...walk(p));
		} else if (EXT.test(entry)) out.push(p);
	}
	return out;
}

let touched = 0;
for (const file of walk(ROOT)) {
	const src = readFileSync(file, 'utf8');
	let cur = src;
	for (const [re, to] of PAIRS) cur = cur.replace(re, to);
	if (cur !== src) {
		writeFileSync(file, cur);
		touched++;
		console.log(`  ✓ ${path.relative(ROOT, file).replaceAll('\\', '/')}`);
	}
}

console.log(
	`\n已改名：my-theme → ${name}（${touched} 个文件）。` +
		`\n还需手动处理：中文文案与 label、icon、README 叙述、删不用的示例。` +
		`\n下一步：pnpm install && pnpm test && pnpm check`
);
