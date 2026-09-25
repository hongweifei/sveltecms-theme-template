import { describe, it, expect } from 'vitest';
import config from './theme.config';
import customizer from './theme.customizer';

/**
 * 主题契约自检（改名、加设置项、加模板之后跑一次即可发现问题）。
 *
 * 这些断言对应的都是**运行时不报错**的错法：目录名冲突会让主题注册不上却
 * 只在后台列一条失败；customizer 引用不存在的字段只会静默少一项；两种语言
 * 的 key 不一致只会在某语言下出现空洞文案。所以宁可在这里 fail-fast。
 */
describe('主题契约自检', () => {
	it('name 是 kebab-case，且不与内置主题 default 同名', () => {
		// 宿主按 config.name 决定落地目录名，且注册表拒收「目录名 ≠ name」；
		// kebab 与宿主 zip 安装的字符集校验同口径
		expect(config.name).toMatch(/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/);
		expect(config.name).not.toBe('default');
		expect(config.version).toMatch(/^\d+\.\d+\.\d+/);
	});

	it('layouts 非空，defaultLayout 与模板声明的 layout 都真实存在', () => {
		const layoutNames = Object.keys(config.layouts);
		expect(layoutNames.length).toBeGreaterThan(0);
		expect(layoutNames).toContain(config.defaultLayout);
		for (const t of config.templates) {
			if (t.layout) expect(layoutNames, `模板 ${t.type} 的 layout`).toContain(t.layout);
		}
	});

	it('templates 的 type 唯一，且至少覆盖 home / 404', () => {
		const types = config.templates.map((t) => t.type);
		expect(new Set(types).size).toBe(types.length);
		expect(types).toContain('home');
		expect(types).toContain('404');
	});

	it('settings 字段 key 跨分组唯一', () => {
		const keys = (config.settings ?? []).flatMap((s) => s.fields.map((f) => f.key));
		expect(new Set(keys).size).toBe(keys.length);
	});

	it('customizer 引用的每个字段都真实存在于 settings', () => {
		const known = (config.settings ?? []).flatMap((s) => s.fields.map((f) => f.key));
		for (const panel of customizer.panels) {
			for (const field of panel.fields) {
				// vitest 没有 chai 的 .has 链式断言；用 toContain 才会在失败时报出字段名
				expect(known, `定制器面板 ${panel.key} 引用了不存在的字段`).toContain(field);
			}
		}
		expect(new Set(customizer.panels.map((p) => p.key)).size).toBe(customizer.panels.length);
	});

	it('各语言 locale 都 default 导出扁平 map，且 key 集合一致', async () => {
		const locales = config.locales ?? {};
		expect(Object.keys(locales).length).toBeGreaterThan(0);
		const keysets = new Map<string, string[]>();
		for (const [lang, load] of Object.entries(locales)) {
			const mod = await load();
			expect(mod.default, `${lang} 必须 default 导出`).toBeTypeOf('object');
			keysets.set(
				lang,
				Object.keys(mod.default).sort()
			);
		}
		const [first, ...rest] = [...keysets.values()];
		for (const keys of rest) expect(keys).toEqual(first);
	});
});
