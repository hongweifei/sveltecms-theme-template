<script lang="ts">
	/**
	 * 空白布局：无页头/页脚，供落地页等需要独占视口的模板用
	 * （theme.config.ts 里给模板写 layout: 'blank' 即走这条）。
	 */
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<main class="blank-root">
	{@render children()}
</main>

<style>
	.blank-root {
		min-height: 100vh;
		color: var(--color-text);
		background: var(--color-bg);
	}
</style>
