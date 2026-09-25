/**
 * 生成 npm 发布目录 dist/npm/（与插件模板同名同职责的脚本）。
 *
 * 摊平是必须的：宿主收录主题靠 import.meta.glob 匹配
 * data/themes/<name>/theme.config.ts，而 npm 包里的主题要靠一行 re-export
 * shim 进册（宿主 glob 不匹配 node_modules）。发布物因此必须是
 * 「theme.config.ts 在包根」的形态——与 zip 那条共用同一份判断。
 *
 * 模板自身 package.json 保持 private: true，发布的是这里生成的
 * dist/npm/package.json；作者不需要为了 publish 去改 private，也不会把模板本身推上 registry。
 *
 * 用法：
 *   node scripts/prepare-npm-pkg.mjs
 *   npm publish ./dist/npm --access public
 */
import { readFileSync, writeFileSync, mkdirSync, cpSync, readdirSync, statSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'theme');
const OUT = path.join(ROOT, 'dist', 'npm');

const pkg = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const configSource = readFileSync(path.join(SRC, 'theme.config.ts'), 'utf8');
/**
 * 锚定 `export default {` 后再取字段——文件里 props 类型/常量声明都可能带 name:，
 * 取「首个 name:」会截胡。口径与宿主 zip-install.ts 的 extractThemeConfigName 一致：
 * 两处对身份的理解必须同源，否则安装期归一的目录名和发布物里的 name 会分叉。
 */
function configField(key) {
	const marker = /export\s+default\s*\{/.exec(configSource);
	const scope = marker ? configSource.slice(marker.index) : configSource;
	const m = new RegExp(`\\b${key}\\s*:\\s*(['"])([^'"]+)\\1`).exec(scope);
	return m?.[2]?.trim();
}

const name = pkg.name;
if (name === 'sveltecms-theme-template') {
	console.error('[npm-pkg] 包名仍是模板默认名——先跑 node scripts/rename.mjs <name>');
	process.exit(1);
}
if (!name.startsWith('sveltecms-theme-')) {
	console.error(`[npm-pkg] 包名 ${name} 不符合 sveltecms-theme-<name> 约定`);
	process.exit(1);
}
const themeName = configField('name');
if (!themeName) {
	console.error('[npm-pkg] theme/theme.config.ts 未找到 config.name');
	process.exit(1);
}
const version = configField('version') ?? pkg.version;

const isPublishable = (rel) => !/\.test\.ts$/.test(rel.replaceAll('\\', '/'));

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
for (const entry of readdirSync(SRC)) {
	const abs = path.join(SRC, entry);
	if (statSync(abs).isDirectory()) {
		cpSync(abs, path.join(OUT, entry), { recursive: true, filter: (s) => isPublishable(s) });
	} else if (isPublishable(entry)) {
		cpSync(abs, path.join(OUT, entry));
	}
}

writeFileSync(
	path.join(OUT, 'package.json'),
	JSON.stringify(
		{
			name,
			version,
			description: configField('description') ?? pkg.description,
			type: 'module',
			main: './theme.config.ts',
			exports: { '.': './theme.config.ts' },
			peerDependencies: { svelte: '^5.0.0' }
		},
		null,
		'\t'
	) + '\n'
);

console.log(`[npm-pkg] 发布物已生成 → dist/npm/（${name}@${version}）`);
console.log('[npm-pkg] 试运行： npm publish ./dist/npm --dry-run');
console.log('[npm-pkg] 正式发布： npm publish ./dist/npm --access public');
console.log('');
console.log('[install] 装好后要在宿主里补一行 shim，否则宿主 glob 匹配不到它：');
console.log(`[install]   data/themes/${themeName}/theme.config.ts`);
console.log(`[install]   export { default } from '${name}';`);
console.log('[install]   目录名必须等于 config.name（此处即 ' + themeName + '）——');
console.log('[install]   不一致会被宿主注册表拒收（渲染端按 /data/themes/<name>/ 反查组件模块）');
console.log('[install] 补完需重新构建：主题组件是编译期收录，装完不重建不会生效');
