import type { CMSRecord, PageResult, TemplateLoaderFn } from '$lib/cms/types/theme';
import { NotFoundError } from '$lib/common/errors';
import { getPageParams } from './loader-utils';

/** 列表页模板的 props 契约 */
export interface ListData {
	records: CMSRecord[];
	meta: PageResult<CMSRecord>['meta'];
	collection: string;
	collectionLabel: string;
	pageMeta: Record<string, unknown>;
}

export const loader: TemplateLoaderFn<ListData> = async (ctx) => {
	const collection = ctx.params.collection ?? '';
	const config = ctx.cms.collections.get(collection);
	// 集合不存在即「拒单」：抛 NotFoundError 让路由器继续尝试下一优先级模板
	// （例如把未知路径让给 page 单页模板）。返回 null/空数据会被渲染成 200 的
	// 「未找到」页——那是 SEO 上更糟的软 404。
	if (!collection || !config) {
		throw new NotFoundError(`Unknown collection: ${collection}`);
	}
	// 树形集合没有平铺列表页形态，同样拒单
	if (config.kind === 'tree') throw new NotFoundError(`Tree collection: ${collection}`);

	const { page, perPage } = getPageParams(ctx);
	const result = await ctx.cms.content.query(collection, {
		page,
		limit: perPage,
		sort: '-createdAt'
	});
	const collectionLabel = config.label ?? collection;

	return {
		records: result.data,
		meta: result.meta,
		collection,
		collectionLabel,
		pageMeta: {
			title: collectionLabel,
			canonical: ctx.origin ? `${ctx.origin}/${collection}` : undefined
		}
	};
};
