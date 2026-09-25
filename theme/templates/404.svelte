<script lang="ts">
	let { themeLabels = {} }: { themeLabels?: Record<string, string> } = $props();
</script>

<section class="notfound">
	<h1>404</h1>
	<p>{themeLabels['theme.notFound'] ?? '页面不存在'}</p>
	<a href="/">回首页</a>
</section>

<style>
	.notfound {
		padding: 4rem 0;
		text-align: center;
	}
	h1 {
		font-size: 3rem;
		margin: 0;
	}
</style>
