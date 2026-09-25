<script lang="ts">
	import type { CMSRecord } from '$lib/cms/types/theme';

	let {
		record,
		related = []
	}: {
		record?: CMSRecord | null;
		related?: CMSRecord[];
	} = $props();

	// richtext/markdown 字段宿主已渲染或原样存串；模板示例直接输出纯文本，
	// 真要渲染 HTML 请用 $lib/common/components/render/RichTextRenderer.svelte
	const body = $derived(String(record?.content ?? record?.body ?? ''));
</script>

<article>
	<h1>{String(record?.title ?? '')}</h1>
	<p class="body">{body}</p>
</article>

{#if related.length > 0}
	<section class="related">
		<h2>相关</h2>
		<ul>
			{#each related as r (r.id)}
				<li>
					<a href={`/${String(r.slug ?? r.id)}`}>{String(r.title ?? '未命名')}</a>
				</li>
			{/each}
		</ul>
	</section>
{/if}

<style>
	h1 {
		font-size: 1.75rem;
		margin: 0 0 0.5rem;
	}
	.body {
		line-height: 1.75;
		white-space: pre-wrap;
	}
	.related h2 {
		font-size: 1.1rem;
	}
	.related ul {
		list-style: none;
		padding: 0;
	}
</style>
