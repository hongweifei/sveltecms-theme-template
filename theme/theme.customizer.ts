import type { ThemeCustomizerConfig } from '$lib/cms/types/theme';

/**
 * 定制器：把 settings 字段分面板暴露给站长实时预览。
 *
 * fields 里的每一项必须是 theme.config.ts 中真实存在的字段 key——写错不会报错，
 * 只会在面板里消失，所以 theme.test.ts 专门断言了这一点。
 */
const customizer: ThemeCustomizerConfig = {
	panels: [
		{ key: 'style', label: '样式', fields: ['primaryColor', 'contentWidth'] },
		{ key: 'home', label: '首页', fields: ['homeCollection', 'postsPerPage', 'showDate'] },
		{ key: 'footer', label: '页脚', fields: ['footerText'] }
	]
};

export default customizer;
