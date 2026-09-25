import type { CMSRecord, TemplateLoaderFn } from '$lib/cms/types/theme';
import { NotFoundError } from '$lib/common/errors';

/** 详情页模板的 props 契约 */
export interface DetailData {
	record: CMSRecord;
	related: CMSRecord[];
	collection: string;
	url: string;
	pageMeta: Record<string, unknown>;
}

export const loader: TemplateLoaderFn<DetailData> = async (ctx) => {
	const { collection, slug } = ctx.params;
	const config = collection ? ctx.cms.collections.get(collection) : undefined;
	if (!collection || !slug || !config) {
		throw new NotFoundError(`Unknown collection: ${collection}`);
	}
	if (config.kind === 'tree') throw new NotFoundError(`Tree collection: ${collection}`);

	// 可见性由平台决定：匿名只拿到 published 且未软删的记录，草稿/回收站返回 null。
	// 这里必须抛 NotFoundError「拒单」而不是渲染一张空详情卡。
	const record = await ctx.cms.content.findBySlug(collection, slug);
	if (!record) throw new NotFoundError(`Record not found: ${collection}/${slug}`);

	let related: CMSRecord[] = [];
	try {
		related = await ctx.cms.content.findRelated(record, { collection, limit: 3 });
	} catch {
		/* 关联查询失败不该让详情页消失 */
	}

	const url = `${ctx.origin ?? ''}/${collection}/${String(record.slug ?? record.id)}`;
	return {
		record,
		related,
		collection,
		url,
		pageMeta: {
			title: String(record.metaTitle || record.title || ''),
			description: String(record.metaDescription || record.excerpt || '').slice(0, 160),
			canonical: record.canonicalUrl ? String(record.canonicalUrl) : url,
			ogImage: record.ogImage ? String(record.ogImage) : undefined,
			ogType: 'article'
		}
	};
};
