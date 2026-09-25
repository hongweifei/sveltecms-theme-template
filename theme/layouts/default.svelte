<script lang="ts">
	/**
	 * 默认布局：承载页头/页脚，模板本体渲染进 <main>。
	 *
	 * 前台插槽必须显式挂点——插件 UI 只在你放了 <ThemePluginSlot> 的位置出现。
	 * 忘挂点不会有报错，组件会被静默吞掉（装完评论插件发现页面没变化就是这种）。
	 */
	import type { Snippet } from 'svelte';
	import ThemePluginSlot from '$lib/cms/components/slots/ThemePluginSlot.svelte';
	import type { ThemeSlotDescriptor } from '$lib/cms/types/theme';

	let {
		children,
		settings = {},
		meta = {},
		navItems = [],
		themeLabels = {},
		user = null,
		dir = 'ltr'
	}: {
		children: Snippet;
		settings?: Record<string, unknown>;
		meta?: Record<string, string>;
		/** 后台「导航菜单」注入的项：{ key, label, href? } */
		navItems?: { key: string; label: string; href?: string }[];
		/** theme/locales/*.ts 的文案，键为 'theme.xxx' */
		themeLabels?: Record<string, string>;
		user?: unknown;
		dir?: 'ltr' | 'rtl' | 'auto';
	} = $props();

	const siteName = $derived(String(settings.siteName ?? 'My Theme'));
	const footerText = $derived(String(settings.footerText ?? ''));
</script>

<svelte:head>
	{#if meta.title}<title>{meta.title}</title>{/if}
	{#if meta.description}
		<meta name="description" content={meta.description} />
	{/if}
</svelte:head>

<div class="site-root" {dir}>
	<ThemePluginSlot name="frontend:header" />

	<header class="site-head">
		<a class="brand" href="/">{siteName}</a>
		<nav class="nav">
			{#each navItems as item (item.key)}
				<a href={item.href ?? '/'}>{item.label}</a>
			{/each}
		</nav>
	</header>

	<main class="site-main">
		{@render children()}
	</main>

	<footer class="site-foot">
		{#if footerText}<span>{footerText}</span>{/if}
		<span class="muted">{user ? '' : themeLabels['theme.poweredBy'] ?? ''}</span>
	</footer>

	<ThemePluginSlot name="frontend:footer" />
</div>

<style>
	.site-root {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		color: var(--color-text);
		background: var(--color-bg);
	}
	.site-head {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		padding: 0.75rem 1rem;
		border-bottom: 1px solid var(--color-border);
	}
	.brand {
		font-weight: 600;
		text-decoration: none;
		color: inherit;
	}
	.nav {
		display: flex;
		gap: 1rem;
		font-size: 0.9rem;
	}
	.nav a {
		color: var(--color-text-secondary);
		text-decoration: none;
	}
	.site-main {
		flex: 1;
		width: 100%;
		max-width: 60rem;
		margin: 0 auto;
		padding: 1.5rem 1rem;
	}
	.site-foot {
		display: flex;
		justify-content: space-between;
		padding: 1rem;
		border-top: 1px solid var(--color-border);
		font-size: 0.85rem;
	}
	.muted {
		opacity: 0.6;
	}
</style>
