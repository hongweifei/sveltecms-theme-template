import type { ThemeBlockDeclaration } from '$lib/cms/types/theme';
import Callout from './callout.svelte';

/**
 * 区块渲染表。键 = 后台内容类型构建器里的组件名（大小写敏感，必须逐字一致）。
 * 这里只登记「主题能渲染什么」，字段定义与表单由 CTB 负责，与主题无关。
 */
export const themeBlocks: Record<string, ThemeBlockDeclaration> = {
	Callout: { label: '提示框', icon: '💡', render: Callout }
};
