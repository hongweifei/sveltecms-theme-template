/**
 * 宿主框架自动装配：.sveltecms/ = 框架 checkout，本仓自持（gitignore），
 * 主题开发者不需要预先在别处 clone 框架。主题名从 theme/theme.config.ts 的
 * config.name 动态读取——模板改名后无需改脚本。
 *
 * 首次运行自动完成（慢一次，之后增量）：
 *   1. git clone --depth 1 框架仓库到 .sveltecms/
 *   2. 宿主 pnpm install
 *   3. svelte-kit sync + drizzle-kit generate + paraglide compile（fresh clone 补齐）
 *   4. 把 theme/ 同步进 .sveltecms/data/themes/<name>/（编译期 glob 收录）
 *
 * 用法：
 *   node scripts/ensure-host.mjs            # 装配/刷新
 *   node scripts/ensure-host.mjs --sync     # 只同步主题源码
 *   node scripts/ensure-host.mjs --check    # 只校验已装配，未装配退出码 1
 *
 * 覆盖：SVELTECMS_REPO（框架 git URL）、SVELTECMS_REF（分支/标签，默认 master）
 */
import { existsSync, mkdirSync, cpSync, lstatSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HOST = path.join(ROOT, '.sveltecms');
const THEME_SRC = path.join(ROOT, 'theme');
const REPO = process.env.SVELTECMS_REPO || 'https://gitee.com/hongweifei/sveltecms-starter.git';
const REF = process.env.SVELTECMS_REF || 'master';
/** 失败提示里给出可直接粘贴的命令——版本取本仓 packageManager，不另写死一个版本 */
const PNPM_VERSION =
	/pnpm@([\d.]+)/.exec(JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8')).packageManager ?? '')?.[1] ??
	'latest';

/**
 * 主题名 = theme.config.ts 的 config.name。
 * 锚定 `export default {` 之后再取首个 name：模板里 loader/组件的 props 类型
 * 常出现别的 `name:` 字段，取「文件首个 name:」会截胡到错的值（宿主安装期用的
 * 是同一套锚定解析——zip-install.ts extractThemeConfigName，两处必须同口径）。
 *
 * 为什么目录名必须由 name 决定：宿主注册表 collectThemes() 拒收
 * 「目录名 ≠ config.name」的主题——ThemePage 按 /data/themes/<name>/ 前缀反查
 * 组件模块，不一致的主题注册得上、后台看得见、能激活，一渲染却报 not found。
 */
function themeName() {
	const src = readFileSync(path.join(THEME_SRC, 'theme.config.ts'), 'utf8');
	const m = /export\s+default\s*\{[\s\S]{0,800}?\bname\s*:\s*(['"])([^'"]+)\1/.exec(src);
	const raw = m?.[2]?.trim();
	if (!raw || !/^[a-zA-Z0-9_-]+$/.test(raw)) {
		console.error('[host] theme/theme.config.ts 未找到合法 config.name（仅限字母数字 _ -）');
		process.exit(1);
	}
	return raw;
}

const NAME = themeName();
const THEME_DEST = path.join(HOST, 'data/themes', NAME);

const args = process.argv.slice(2);
const CHECK = args.includes('--check');
const SYNC_ONLY = args.includes('--sync');

function sh(cmd, cmdArgs, opts = {}) {
	// Node ≥22 禁止无 shell 直启 .cmd（pnpm 在 Windows 是 cmd shim，EINVAL）；
	// 统一经 cmd /c 解析 PATH
	if (process.platform === 'win32') {
		execFileSync('cmd.exe', ['/c', cmd, ...cmdArgs], { stdio: 'inherit', ...opts });
	} else {
		execFileSync(cmd, cmdArgs, { stdio: 'inherit', ...opts });
	}
}

function hostCloned() {
	return existsSync(path.join(HOST, 'package.json'));
}

function rmrf(dir) {
	// 整体移除自建运行副本。统一走 cmd.exe/rm 显式解释器——裸 'cmd' 在部分
	// Windows 环境 spawn 直接 EPERM（与 pnpm shim EINVAL 同一族问题）
	if (process.platform === 'win32') {
		execFileSync('cmd.exe', ['/c', 'rmdir', '/s', '/q', dir], { stdio: 'ignore' });
	} else {
		execFileSync('rm', ['-rf', dir], { stdio: 'ignore' });
	}
}

function syncTheme() {
	const exists = lstatSync(THEME_DEST, { throwIfNoEntry: false });
	if (exists) {
		// 陈旧副本整体移除再拷（静默合并会留已删文件）。宿主 dev 运行中其
		// watcher 可能锁住文件致删除失败（Windows EPERM）——降级为增量覆盖
		// （可能残留已删文件，dev 期可接受），不阻断热同步。
		try {
			rmrf(THEME_DEST);
		} catch {
			console.warn('[host] 运行副本被占用（宿主 dev watcher？），改为增量覆盖同步');
		}
	}
	mkdirSync(path.dirname(THEME_DEST), { recursive: true });
	cpSync(THEME_SRC, THEME_DEST, {
		recursive: true,
		// 测试不进宿主（运行副本只留发布物等价内容）
		filter: (src) => !/\.test\.ts$/.test(src.replaceAll('\\', '/'))
	});
}

function ensure() {
	if (!hostCloned()) {
		console.log(`[host] 首次装配：clone ${REPO} (${REF}) → .sveltecms/（几分钟）`);
		sh('git', ['clone', '--depth', '1', '--branch', REF, REPO, HOST]);
	} else if (process.env.SVELTECMS_HOST_PULL === '1') {
		// 可选增量（默认关——装配后宿主锁定在 clone 时的 commit，行为可复现）
		console.log('[host] git pull --depth 1…');
		sh('git', ['pull', '--depth', '1', 'origin', REF], { cwd: HOST });
	}

	// 只有确实要跑 pnpm 时才前置校验：否则「宿主已装配好、只同步源码」这条
	// 常用路径会被一个用不上的检查挡住
	const needsPnpm =
		!existsSync(path.join(HOST, 'node_modules')) ||
		!existsSync(path.join(HOST, '.svelte-kit/tsconfig.json')) ||
		!existsSync(path.join(HOST, 'drizzle/meta/_journal.json')) ||
		!existsSync(path.join(HOST, 'src/lib/paraglide/messages'));
	if (needsPnpm) {
		// 复用下方 sh() 的平台分派，别另写一套：cmd.exe 只在 Windows 存在，硬写它会让
		// Linux/macOS 上 pnpm 正常时也探到「不可执行」（CI 实测踩过）。
		try {
			sh('pnpm', ['--version'], { stdio: 'ignore' });
		} catch {
			console.error('[host] 需要装配宿主，但本进程无法执行 pnpm');
			console.error(
				'[host] Windows 上常见原因是 corepack 的 pnpm shim 损坏（报 Cannot find module …corepack/dist/pnpm.js）。'
			);
			console.error('[host] 修好 pnpm，或先手动执行：');
			console.error(`[host]   npx pnpm@${PNPM_VERSION} install --dir "${HOST}"`);
			process.exit(1);
		}
	}

	if (!existsSync(path.join(HOST, 'node_modules'))) {
		console.log('[host] 安装框架依赖 pnpm install（一次性，较慢）…');
		sh('pnpm', ['install', '--prefer-offline'], { cwd: HOST });
	}
	// 半成品防护：install 被中断会留下缺文件的 node_modules，而 pnpm 状态文件
	// 记为已完成——普通 install 不补链，dev 期才炸 ERR_MODULE_NOT_FOUND。
	// 探测宿主关键入口（better-auth 子路径），缺失时给出确切修复指令。
	if (!existsSync(path.join(HOST, 'node_modules/better-auth/dist/auth/minimal.mjs'))) {
		console.error(
			'[host] .sveltecms/node_modules 疑似半成品（better-auth dist 缺文件，常见于 install 被中断）'
		);
		console.error(`[host] 修复：pnpm --dir "${HOST}" install --force`);
		process.exit(1);
	}
	if (!existsSync(path.join(HOST, '.svelte-kit/tsconfig.json'))) {
		sh('pnpm', ['exec', 'svelte-kit', 'sync'], { cwd: HOST });
	}
	// 脚手架契约：drizzle/ 迁移不入 git，fresh clone 缺它则 dev 启动 runMigrations
	// 必炸——秒级确定性代码生成（不连库），装配阶段补做
	if (!existsSync(path.join(HOST, 'drizzle/meta/_journal.json'))) {
		console.log('[host] 生成系统表迁移 drizzle/（drizzle-kit generate）…');
		sh('pnpm', ['exec', 'drizzle-kit', 'generate'], {
			cwd: HOST,
			env: { ...process.env, DATABASE_URL: 'file:./data/local.db' }
		});
	}
	// paraglide 文案层是生成物（宿主 .gitignore 排除）——fresh clone 显式补
	if (!existsSync(path.join(HOST, 'src/lib/paraglide/messages'))) {
		sh(
			'pnpm',
			[
				'exec',
				'paraglide-js',
				'compile',
				'--project',
				'./project.inlang',
				'--outdir',
				'./src/lib/paraglide'
			],
			{ cwd: HOST }
		);
	}
	syncTheme();
}

if (CHECK) {
	const ok =
		hostCloned() &&
		existsSync(path.join(HOST, 'node_modules')) &&
		existsSync(path.join(HOST, '.svelte-kit/tsconfig.json')) &&
		existsSync(path.join(HOST, 'src/lib/paraglide/messages'));
	if (!ok) {
		console.error(
			'[host] .sveltecms 未装配——先运行 pnpm dev / pnpm test（会自动装配），或手动 pnpm ensure'
		);
		process.exit(1);
	}
	process.exit(0);
}

if (SYNC_ONLY) {
	if (!hostCloned()) {
		console.error('[host] .sveltecms 不存在——先运行 pnpm dev（自动 clone 装配）');
		process.exit(1);
	}
	syncTheme();
	console.log(`[host] 主题源码已同步进 .sveltecms/data/themes/${NAME}/`);
	process.exit(0);
}

ensure();
