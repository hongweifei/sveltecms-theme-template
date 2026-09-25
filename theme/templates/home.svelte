<script lang="ts">
	import type { CMSRecord } from '$lib/cms/types/theme';

	let {
		featured = [],
		latest = [],
		collectionLabel = '',
		themeLabels = {}
	}: {
		featured?: CMSRecord[];
		latest?: CMSRecord[];
		collectionLabel?: string;
		themeLabels?: Record<string, string>;
	} = $props();

	// CMSRecord 的自定义字段经索引签名是 unknown，取值要显式收窄
	function href(r: CMSRecord): string {
		return `/${String(r.slug ?? r.id)}`;
	}
	function title(r: CMSRecord): string {
		return String(r.title ?? '未命名');
	}
</script>

{#if featured.length === 0 && latest.length === 0}
	<section class="empty">
		<p>首页还没有内容。</p>
		<a href="/admin">去后台创建内容类型与内容</a>
	</section>
{:else}
	{#each featured as r (r.id)}
		<article class="featured">
			<h2><a href={href(r)}>{title(r)}</a></h2>
		</article>
	{/each}
	<h3>{collectionLabel || themeLabels['theme.latest'] || 'Latest'}</h3>
	<ul class="list">
		{#each latest as r (r.id)}
			<li>
				<a href={href(r)}>{title(r)}</a>
			</li>
		{/each}
	</ul>
{/if}

<style>
	.featured h2 {
		margin: 0 0 1rem;
	}
	.list {
		list-style: none;
		padding: 0;
	}
	.list li {
		padding: 0.5rem 0;
		border-bottom: 1px solid var(--color-border);
	}
	.empty {
		padding: 3rem 0;
		text-align: center;
	}
</style>
