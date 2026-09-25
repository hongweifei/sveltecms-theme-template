<script lang="ts">
	/**
	 * [示例·区块] 动态区区块的渲染件。
	 *
	 * 字段定义的唯一事实源是后台「内容类型构建器」的组件（components 表），
	 * 主题这边只提供渲染——注册键必须与那个组件名一致，否则内容里选了它却找不到渲染件。
	 */
	let { data = {} }: { data?: Record<string, unknown> } = $props();
</script>

<aside class="callout">
	<strong>{String(data.title ?? '提示')}</strong>
	<p>{String(data.text ?? '')}</p>
</aside>

<style>
	.callout {
		padding: 0.75rem 1rem;
		border-left: 3px solid var(--color-primary);
		background: var(--color-bg-secondary, rgba(0, 0, 0, 0.03));
	}
	p {
		margin: 0.25rem 0 0;
	}
</style>
