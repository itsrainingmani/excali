<script lang="ts">
	import '../app.css';
	let { children } = $props();
</script>

<div class="container w-screen h-screen">
	{@render children()}
</div>
