<script lang="ts">
	import type { CMSRecord, PageResult } from '$lib/cms/types/theme';

	let {
		records = [],
		meta = { page: 1, limit: 10, total: 0, totalPages: 0 },
		collectionLabel = ''
	}: {
		records?: CMSRecord[];
		// 直接复用 PageResult.meta，不要手写另一套字段名——loader 转发的就是它，
		// 自己声明个 perPage 只会得到一个永远 undefined 的值
		meta?: PageResult<CMSRecord>['meta'];
		collectionLabel?: string;
	} = $props();

	function href(r: CMSRecord): string {
		return `/${String(r.slug ?? r.id)}`;
	}
</script>

<header class="head">
	<h1>{collectionLabel}</h1>
	<p class="count">{meta.total} 篇</p>
</header>

<ul class="list">
	{#each records as r (r.id)}
		<li>
			<a href={href(r)}>{String(r.title ?? '未命名')}</a>
		</li>
	{:else}
		<li class="empty">暂无内容</li>
	{/each}
</ul>

{#if meta.totalPages > 1}
	<nav class="pager">
		{#if meta.page > 1}
			<a href="?page={meta.page - 1}">上一页</a>
		{/if}
		<span>{meta.page} / {meta.totalPages}</span>
		{#if meta.page < meta.totalPages}
			<a href="?page={meta.page + 1}">下一页</a>
		{/if}
	</nav>
{/if}

<style>
	.head {
		display: flex;
		align-items: baseline;
		gap: 1rem;
	}
	h1 {
		font-size: 1.5rem;
		margin: 0;
	}
	.count {
		font-size: 0.85rem;
		opacity: 0.7;
	}
	.list {
		list-style: none;
		padding: 0;
	}
	.list li {
		padding: 0.6rem 0;
		border-bottom: 1px solid var(--color-border);
	}
	.pager {
		display: flex;
		gap: 1rem;
		padding: 1rem 0;
		font-size: 0.9rem;
	}
	.empty {
		opacity: 0.6;
	}
</style>
