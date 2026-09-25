import type { CMSRecord, PageResult, TemplateLoaderFn } from '$lib/cms/types/theme';
import { getPageParams, pickFlatCollection } from './loader-utils';

/** 首页模板的 props 契约：loader 返回值即组件入参 */
export interface HomeData {
	featured: CMSRecord[];
	latest: CMSRecord[];
	collection: string;
	collectionLabel: string;
	meta?: PageResult<CMSRecord>['meta'];
	pageMeta: Record<string, unknown>;
}

export const loader: TemplateLoaderFn<HomeData> = async (ctx) => {
	const collection = pickFlatCollection(ctx);
	// 无平铺集合时首页留空，由模板自己的「去后台创建内容」提示兜底——
	// 不回退到树形集合（那会让卡片链接全部 404）
	if (!collection) {
		return { featured: [], latest: [], collection: '', collectionLabel: '', pageMeta: {} };
	}

	const { page, perPage } = getPageParams(ctx);
	// 查询失败等真实错误直接上抛：不把 500 伪装成「没有内容」的 200
	const result = await ctx.cms.content.query(collection, {
		page,
		limit: perPage,
		sort: '-createdAt'
	});
	const config = ctx.cms.collections.get(collection);

	return {
		featured: result.data.slice(0, 1),
		latest: result.data.slice(1),
		collection,
		collectionLabel: config?.label ?? collection,
		meta: result.meta,
		pageMeta: {
			title: config?.label ?? collection,
			canonical: ctx.origin ? `${ctx.origin}/` : undefined
		}
	};
};
