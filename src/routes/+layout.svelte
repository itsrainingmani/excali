<script lang="ts">
	import { initializeStores, Modal, storePopup } from '@skeletonlabs/skeleton';
	import { computePosition, autoUpdate, offset, shift, flip, arrow } from '@floating-ui/dom';
	import { setContext } from 'svelte';
	import '../app.css';
	let { children } = $props();
	initializeStores();
	const iconCtx = {
		size: '16'
	};
	setContext('iconCtx', iconCtx);
	storePopup.set({ computePosition, autoUpdate, offset, shift, flip, arrow });
</script>

<Modal />
{@render children()}
