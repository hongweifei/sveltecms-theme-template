import type { ThemeConfig, ThemeTemplateDeclaration } from '$lib/cms/types/theme';
import DefaultLayout from './layouts/default.svelte';
import BlankLayout from './layouts/blank.svelte';
import HomeTemplate from './templates/home.svelte';
import ListTemplate from './templates/list.svelte';
import DetailTemplate from './templates/detail.svelte';
import NotFoundTemplate from './templates/404.svelte';
import { loader as homeLoader, type HomeData } from './templates/home.loader';
import { loader as listLoader, type ListData } from './templates/list.loader';
import { loader as detailLoader, type DetailData } from './templates/detail.loader';
import { themeBlocks } from './blocks';
import customizer from './theme.customizer';

/**
 * 模板声明逐条显式标注 ThemeTemplateDeclaration<XxxData>。
 *
 * 这不是可选的糖，而是开关：省略标注时 TS 要同时从 component（props 在逆变位）
 * 与 loader（返回值在协变位）推断 Data，两处冲突即退回泛型默认值 any，于是
 * loader 与组件之间的约束整体消失且**不报任何错**。另一半前提是检查器必须是
 * svelte-check（pnpm check）——裸 tsc 看不见 .svelte 的 props，同样静默失效。
 */
const home: ThemeTemplateDeclaration<HomeData> = {
	type: 'home',
	label: '首页',
	component: HomeTemplate,
	loader: homeLoader
};

/**
 * 列表页：`match` 决定 URL 形态与优先级——同 type 的候选按 priority 逐条尝试，
 * loader 抛 NotFoundError 即「拒单」，路由器继续下一候选（最终落 404 模板）。
 * 不写 match 就用默认的 /<集合>/<slug> 约定。
 */
const list: ThemeTemplateDeclaration<ListData> = {
	type: 'list',
	label: '列表页',
	component: ListTemplate,
	loader: listLoader
};

const detail: ThemeTemplateDeclaration<DetailData> = {
	type: 'detail',
	label: '详情页',
	component: DetailTemplate,
	loader: detailLoader
};

/** 404 无 loader：全部候选拒单后由路由器兜底渲染，并输出真实 404 状态码 */
const notFound: ThemeTemplateDeclaration = {
	type: '404',
	label: '404 页面',
	component: NotFoundTemplate
};

export default {
	name: 'my-theme',
	label: 'My Theme',
	version: '0.1.0',
	description: 'SvelteCMS 主题模板——改名即用的起点',
	author: 'Your Name',

	/** 布局：键名被 templates[].layout 与 defaultLayout 引用 */
	layouts: { default: DefaultLayout, blank: BlankLayout },
	defaultLayout: 'default',

	templates: [home, list, detail, notFound],

	/**
	 * 区块渲染表：键须与后台「内容类型构建器」里组件名一致。
	 * 字段定义的唯一事实源是 CTB 的 components 表，主题只负责渲染。
	 */
	blocks: themeBlocks,

	/**
	 * 站长设置：分组 → 字段。cssVar 让字段直接映射成 CSS 变量（宿主注入 :root），
	 * source 让下拉项由平台现算（collections / plugins / menus）。
	 */
	settings: [
		{
			key: 'style',
			label: '样式',
			fields: [
				{
					key: 'primaryColor',
					type: 'color',
					label: '主色调',
					default: '#4f6ef7',
					cssVar: '--color-primary'
				},
				{ key: 'contentWidth', type: 'number', label: '正文宽度(px)', default: 46 }
			]
		},
		{
			key: 'home',
			label: '首页',
			fields: [
				{ key: 'homeCollection', type: 'select', label: '首页集合', source: 'collections' },
				{ key: 'postsPerPage', type: 'number', label: '每页数量', default: 10 },
				{ key: 'showDate', type: 'boolean', label: '显示日期', default: true }
			]
		},
		{
			key: 'footer',
			label: '页脚',
			fields: [{ key: 'footerText', type: 'text', label: '页脚文字', default: 'Powered by SvelteCMS' }]
		}
	],

	customizer,

	/**
	 * 前台文案（themeLabels 注入布局与模板）。
	 * 必须 `export default` 一个扁平 map——类型已收紧为 Promise<{ default: ... }>。
	 */
	locales: {
		'zh-CN': () => import('./locales/zh-CN'),
		en: () => import('./locales/en')
	},

	/**
	 * 依赖声明：collections 校验集合存在，plugins 要求插件已启用。
	 * 缺依赖时主题**不可激活、不可分配、渲染期转 503**，且后台主题页列出依赖状态；
	 * 反向也有保护——被主题依赖的插件停用时会被拒绝。
	 */
	requires: { collections: ['pages'] }
} satisfies ThemeConfig;
