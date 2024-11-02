<script lang="ts">
	import { initializeStores, Modal } from '@skeletonlabs/skeleton';
	import { setContext } from 'svelte';
	import '../app.css';
	let { children } = $props();
	initializeStores();
	const iconCtx = {
		size: '16'
	};
	setContext('iconCtx', iconCtx);
</script>

<Modal />
{@render children()}
