import type { TemplateLoaderContext } from '$lib/cms/types/theme';

/** 分页参数：转发 URL 的 page/limit，非法值回退默认（不要把异常当 0 页渲染） */
export function getPageParams(ctx: TemplateLoaderContext, defaultPerPage = 10) {
	const rawPage = Number(ctx.query.get('page'));
	const rawLimit = Number(ctx.settings.postsPerPage ?? defaultPerPage);
	const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
	const perPage = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.floor(rawLimit) : defaultPerPage;
	return { page, perPage };
}

/**
 * 取首页要展示的集合：设置里的 homeCollection 必须是**平铺**集合才可用。
 * 树形集合（如 pages）的详情 URL 形态不同，选中后卡片的 /<集合>/<slug> 全 404；
 * 历史脏值也可能仍存着它，故运行时再校验一次 kind。
 */
export function pickFlatCollection(ctx: TemplateLoaderContext): string {
	const configured = typeof ctx.settings.homeCollection === 'string' ? ctx.settings.homeCollection : '';
	const configuredConfig = configured ? ctx.cms.collections.get(configured) : undefined;
	if (configuredConfig && (configuredConfig.kind ?? 'collection') === 'collection') return configured;
	return (
		ctx.cms.collections
			.list()
			.find((c) => (c.kind ?? 'collection') === 'collection' && c.source !== 'plugin')?.slug ?? ''
	);
}
