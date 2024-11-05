<script lang="ts">
	import { getModalStore } from '@skeletonlabs/skeleton';
	import { browser } from '$app/environment';
	import { RangeSlider, SlideToggle, popup } from '@skeletonlabs/skeleton';
	import {
		Hand,
		Box,
		Circle,
		Eraser,
		Image,
		BorderSolid,
		BorderDotted,
		BorderDashed,
		BorderStyle,
		Text,
		InfoCircled,
		CornerTopLeft,
		FontBold,
		FontItalic,
		FontSize,
		ColorWheel,
		Width,
		BlendingMode,
		Pencil1,
		MagicWand,
		PaperPlane,
		CursorArrow
	} from 'svelte-radix';
	import type { ModalSettings, PopupSettings } from '@skeletonlabs/skeleton';

	const modalStore = getModalStore();

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;

	let action = $state('rect');
	let stroke = $state('black');
	let lineWidth = $state(1);
	let lineType = $state('solid');
	let borderRadius = $state(0);
	let shouldFillPolygon = $state(false);
	let isDown = $state(false);

	// Selected Object
	let selectedShape = $state(null);

	// Tracking Mouse Positions
	let startX = $state(0);
	let startY = $state(0);
	let prevX = $state(0);
	let prevY = $state(0);
	let viewportTransform = $state({
		x: 0,
		y: 0,
		scale: 1
	});

	// For Text input
	let curText: string[] = $state([]);
	let writingText = $state(false);
	let isTextBold = $state(false);
	let isTextItalic = $state(false);
	let fontSize = $state(40);

	// For AI Generation Prompt
	let aiPrompt = $state('');
	let generatingAI = $state(false);

	// Runs when the component is loaded and then when dependencies change
	$effect(() => {
		const canvasCtx = canvas.getContext('2d');
		if (canvasCtx) {
			ctx = canvasCtx;
			ctx.canvas.width = window.innerWidth;
			ctx.canvas.height = window.innerHeight;
			console.log(ctx.canvas.width, ctx.canvas.height);
			ctx.canvas.style.cursor = 'auto';
			ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
			// drawExistingObjects();

			requestAnimationFrame(drawExistingObjects);
		}
	});

	function getLineDash(linetype: string) {
		if (linetype === 'solid') {
			return [];
		} else if (linetype === 'dotted') {
			return [2, 2];
		} else if (linetype === 'dashed') {
			return [6, 6];
		}

		return [];
	}

	function makeBorderRadius(border_rad: number) {
		const border_rad_squared = border_rad;
		return [border_rad_squared, border_rad_squared, border_rad_squared, border_rad_squared];
	}

	function drawRect(
		startX: number,
		startY: number,
		w: number,
		h: number,
		fill: boolean = false,
		border_rad: number
	) {
		ctx.beginPath();
		ctx.roundRect(startX, startY, w, h, makeBorderRadius(border_rad));
		ctx.closePath();
		if (fill) {
			ctx.fill();
		} else {
			ctx.stroke();
		}
	}

	function drawOval(startX: number, startY: number, x: number, y: number, fill = false) {
		ctx.beginPath();
		ctx.moveTo(startX, startY + (y - startY) / 2);
		ctx.bezierCurveTo(startX, startY, x, startY, x, startY + (y - startY) / 2);
		ctx.bezierCurveTo(x, y, startX, y, startX, startY + (y - startY) / 2);
		ctx.closePath();

		if (fill) {
			ctx.fill();
		} else {
			ctx.stroke();
		}
	}

	let objectStore: any[] = $state([]);

	// Main render loop for objects that have been created previously
	function drawExistingObjects() {
		if (browser) {
			ctx.setTransform(1, 0, 0, 1, 0, 0);
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.translate(viewportTransform.x, viewportTransform.y);

			for (let obj of objectStore) {
				ctx.strokeStyle = obj.stroke;
				ctx.lineWidth = obj.linewidth ?? 1;
				ctx.setLineDash(getLineDash(obj.linetype));
				ctx.fillStyle = obj.stroke;

				// Sad that Svelte disallows some more powerful typescript lang features
				// Would prefer to have this be more type checked esp like having an enum
				// for object shape
				switch (obj.shape) {
					case 'rect':
						drawRect(obj.startX, obj.startY, obj.width, obj.height, obj.fill, obj.borderradius);
						break;
					case 'circle':
						drawOval(obj.startX, obj.startY, obj.endX, obj.endY, obj.fill);
						break;
					case 'text':
						ctx.font = obj.fontSettings;
						ctx.fillText(obj.text, obj.x, obj.y);
						break;
					default:
						break;
				}

				if (selectedShape && obj === selectedShape) {
					ctx.save();
					ctx.strokeStyle = '#634795'; // Selection color
					ctx.lineWidth = 1;

					// Draw selection bounds
					if (obj.shape === 'rect') {
						ctx.strokeRect(obj.startX - 6, obj.startY - 6, obj.width + 12, obj.height + 12);
					} else if (obj.shape === 'circle') {
						ctx.strokeRect(
							obj.startX - 4,
							obj.startY - 4,
							obj.endX - obj.startX + 8,
							obj.endY - obj.startY + 8
						);
					}
					ctx.restore();
				}
			}

			setCanvasDrawingStyles();
			if (action === 'rect' && isDown) {
				let width = prevX - startX;
				let height = prevY - startY;
				console.log(`Rect dims: ${startX},${startY},${width},${height}`);
				drawRect(
					startX - viewportTransform.x,
					startY - viewportTransform.y,
					width,
					height,
					shouldFillPolygon,
					borderRadius
				);
			} else if (action === 'circle' && isDown) {
				drawOval(
					startX - viewportTransform.x,
					startY - viewportTransform.y,
					prevX - viewportTransform.x,
					prevY - viewportTransform.y,
					shouldFillPolygon
				);
			}
			if (action === 'text' && isDown === false) {
				if (curText.length > 0 && writingText) {
					ctx.font = `${isTextBold ? 'bold' : ''} ${isTextItalic ? 'italic' : ''} ${fontSize}px sans-serif`;
					let text = curText.join('');
					ctx.fillText(text, prevX - viewportTransform.x, prevY - viewportTransform.y);
				}
			}
			requestAnimationFrame(drawExistingObjects);
		}
	}

	function getCurrentMousePosition(evt: MouseEvent) {
		var rect = canvas.getBoundingClientRect();
		let x = ((evt.clientX - rect.left) / (rect.right - rect.left)) * canvas.width;
		let y = ((evt.clientY - rect.top) / (rect.bottom - rect.top)) * canvas.height;

		return { x: x, y: y };
	}

	function isPointInShape(x: number, y: number, obj: any) {
		switch (obj.shape) {
			case 'rect':
				return (
					x >= obj.startX &&
					x <= obj.startX + obj.width &&
					y >= obj.startY &&
					y <= obj.startY + obj.height
				);
			case 'circle':
				return x >= obj.startX && x <= obj.endX && y >= obj.startY && y <= obj.endY;
			default:
				return false;
		}
	}

	function setCanvasDrawingStyles() {
		ctx.strokeStyle = stroke;
		ctx.fillStyle = stroke;
		ctx.lineWidth = lineWidth;
		ctx.setLineDash(getLineDash(lineType));
	}

	// requestAnimationFrame(drawExistingObjects);

	function handleMouseDown(evt: MouseEvent) {
		evt.preventDefault();
		evt.stopPropagation();
		if (browser) {
			let mousePos = getCurrentMousePosition(evt);
			let x = mousePos.x - viewportTransform.x;
			let y = mousePos.y - viewportTransform.y;
			// console.log(`Mouse Down at: ${mousePos.x}, ${mousePos.y}`);
			startX = mousePos.x;
			startY = mousePos.y;
			console.log(startX, startY);
			if (action === 'rect' || action === 'circle') {
				isDown = true;

				// IMO: This looks pretty cool and is also what ExcaliDraw does
				canvas.style.cursor = 'crosshair';
			}
			if (action === 'pan') {
				isDown = true;
				canvas.style.cursor = 'move';
			}
			if (action === 'text') {
				canvas.style.cursor = 'text';
			}
		}
	}

	function handleMouseMove(evt: MouseEvent) {
		evt.preventDefault();
		evt.stopPropagation();
		if (browser) {
			let mousePos = getCurrentMousePosition(evt);
			let x = mousePos.x - viewportTransform.x;
			let y = mousePos.y - viewportTransform.y;
			// drawExistingObjects();
			// Set Current Canvas Context Styles
			setCanvasDrawingStyles();

			if (action === 'pan' && isDown) {
				viewportTransform.x += mousePos.x - prevX;
				viewportTransform.y += mousePos.y - prevY;
			}
			if (action === 'select') {
				for (let i = objectStore.length - 1; i >= 0; i--) {
					if (isPointInShape(x, y, objectStore[i])) {
						selectedShape = objectStore[i];
						canvas.style.cursor = 'move';
						return;
					}
				}
				selectedShape = null;
				canvas.style.cursor = 'auto';
			}
			if (action === 'text') {
				let text = curText.join('');
				let currentObject = {
					text: text,
					x: prevX - viewportTransform.x,
					y: prevY - viewportTransform.y,
					width: ctx.measureText(text),
					stroke: stroke,
					timestamp: Date.now() + Math.random(),
					fontSettings: `${isTextBold ? 'bold' : ''} ${isTextItalic ? 'italic' : ''} ${fontSize}px sans-serif`,
					shape: 'text'
				};
				objectStore.push(currentObject);
				writingText = false;
				curText = [];
			}

			prevX = mousePos.x;
			prevY = mousePos.y;
		}
	}

	function handleMouseUp(evt: MouseEvent) {
		evt.preventDefault();
		evt.stopPropagation();
		if (browser) {
			let mousePos = getCurrentMousePosition(evt);
			console.log(`Mouse Up at: ${mousePos.x}, ${mousePos.y}`);
			prevX = mousePos.x;
			prevY = mousePos.y;

			if (action === 'rect' && isDown) {
				let currentObject = {
					startX: startX - viewportTransform.x,
					startY: startY - viewportTransform.y,
					width: prevX - startX,
					height: prevY - startY,
					timestamp: Date.now() + Math.random(),
					stroke: stroke,
					linewidth: lineWidth,
					linetype: lineType,
					fill: shouldFillPolygon,
					borderradius: borderRadius,
					shape: 'rect'
				};
				objectStore.push(currentObject);
				canvas.style.cursor = 'auto';
			} else if (action === 'circle' && isDown) {
				let currentObject = {
					startX: startX - viewportTransform.x,
					startY: startY - viewportTransform.y,
					endX: prevX - viewportTransform.x,
					endY: prevY - viewportTransform.y,
					timestamp: Date.now() + Math.random(),
					stroke: stroke,
					linewidth: lineWidth,
					linetype: lineType,
					fill: shouldFillPolygon,
					shape: 'circle'
				};
				objectStore.push(currentObject);
				canvas.style.cursor = 'auto';
			} else if (action === 'pan' && isDown) {
				canvas.style.cursor = 'pointer';
			}
			isDown = false;
		}
	}

	function handleKeyboard(evt: KeyboardEvent) {
		if (action === 'text' && isDown === false) {
			evt.preventDefault();
			evt.stopPropagation();
			writingText = true;
			let key = evt.key;
			if (evt.repeat) return;

			switch (evt.key) {
				case 'Backspace':
					if (curText.length > 0) {
						curText.pop();
					}
					if (curText.length === 0) {
						writingText = false;
					}
					break;
				case 'Enter':
				case 'Shift':
				case 'Control':
				case 'Alt':
				case 'Escape':
				case 'Meta':
					break;

				default:
					curText.push(key);
					break;
			}
		} else if (action !== 'text') {
			// Basic Undo
			if (evt.getModifierState('Control') && evt.key === 'z') {
				objectStore.pop();
			}
		}
	}

	function resize() {
		ctx.canvas.width = window.innerWidth;
		ctx.canvas.height = window.innerHeight;
	}

	function clearState() {
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		objectStore = [];
	}

	function exportCanvas() {
		let w = canvas.width;
		let h = canvas.height;
		let data = ctx.getImageData(0, 0, w, h);
		const compositeOp = ctx.globalCompositeOperation;
		ctx.globalCompositeOperation = 'destination-over';
		ctx.fillStyle = 'white';
		ctx.fillRect(0, 0, w, h);
		const imgData = canvas.toDataURL('image/jpeg');
		ctx.clearRect(0, 0, w, h);
		ctx.putImageData(data, 0, 0);
		ctx.globalCompositeOperation = compositeOp;

		downloadImage(imgData, 'excali.jpeg');
	}

	function downloadImage(data: string, filename = 'excali-sketch.png') {
		let a = document.createElement('a');
		a.href = data;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	}

	const popupClick: PopupSettings = {
		event: 'click',
		target: 'popupClick',
		placement: 'bottom'
	};

	async function handlePrompt() {
		if (aiPrompt.length > 0) {
			generatingAI = true;

			const response = await fetch('/api/generateObjects', {
				method: 'POST',
				body: JSON.stringify({
					prompt: aiPrompt,
					canvas_width: ctx.canvas.width,
					canvas_height: ctx.canvas.height
				}),
				headers: {
					'content-type': 'application/json'
				}
			});

			if (!response.ok) {
				console.log('Unable to generate AI Objects');
				generatingAI = false;
				aiPrompt = '';
				return;
			}

			const data = await response.json();
			console.log(data);
			const generated_objects = JSON.parse('[' + data[0].text);

			for (let g of generated_objects) {
				objectStore.push(g);
			}

			generatingAI = false;
			aiPrompt = '';
		}
	}
</script>

<svelte:window onresize={resize} onkeydown={handleKeyboard} />

<div
	class="flex h-[100vh] w-[100vw] flex-col justify-between bg-zinc-50 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]"
>
	<div class="flex flex-col justify-center">
		<div class="flex flex-row justify-center gap-2 py-4">
			<button
				class="{action === 'pan'
					? 'variant-ghost-success font-semibold'
					: 'variant-soft'} chip hover:variant-ghost-success"
				onclick={() => {
					action = 'pan';
					canvas.style.cursor = 'pointer';
				}}
			>
				<Hand />
				<span>Pan</span>
			</button>
			<button
				class="{action === 'select'
					? 'variant-ghost-success font-semibold'
					: 'variant-soft'} chip hover:variant-ghost-success"
				onclick={() => {
					action = 'select';
					canvas.style.cursor = 'auto';
				}}
			>
				<CursorArrow />
				<span>Select</span>
			</button>
			<button
				class="{action === 'rect'
					? 'variant-ghost-success font-semibold'
					: 'variant-soft'} chip hover:variant-ghost-success"
				onclick={() => {
					action = 'rect';
					canvas.style.cursor = 'auto';
				}}
			>
				<Box />
				<span>Rect</span>
			</button>
			<button
				class="{action === 'circle'
					? 'variant-ghost-success font-semibold'
					: 'variant-soft'} chip hover:variant-ghost-success"
				onclick={() => {
					action = 'circle';
					canvas.style.cursor = 'auto';
				}}
			>
				<Circle />
				<span>Circle</span>
			</button>
			<button
				class="{action === 'text'
					? 'variant-ghost-success font-semibold'
					: 'variant-soft'} chip hover:variant-ghost-success"
				onclick={() => {
					action = 'text';
					canvas.style.cursor = 'text';
				}}
			>
				<Text />
				<span>Text</span>
			</button>
			<button
				class="{action === 'ai'
					? 'variant-ghost-success font-semibold'
					: 'variant-soft'} {generatingAI
					? 'animate-pulse bg-gradient-to-r from-blue-500 to-purple-500'
					: ''} chip hover:variant-ghost-success"
				onclick={() => {
					action = 'ai';
					canvas.style.cursor = 'pointer';
				}}
				disabled={action === 'ai' && generatingAI}
				use:popup={popupClick}
			>
				<MagicWand />
				<span>AI</span>
			</button>
		</div>
		{#if generatingAI && action === 'ai'}
			<p class="max-w-xl animate-pulse self-center font-mono text-xs italic text-slate-500">
				{aiPrompt}
			</p>
		{/if}
	</div>
	<div data-popup="popupClick" class="min-w-30 card variant-glass rounded p-2">
		<textarea
			placeholder="Describe your prompt..."
			rows="3"
			cols="35"
			bind:value={aiPrompt}
			class="input variant-soft mb-1 resize-none rounded bg-zinc-50 font-mono text-xs"
		></textarea>
		<button
			class="variant-ringed-secondary chip font-semibold hover:variant-filled-tertiary active:variant-filled-success"
			onclick={handlePrompt}
		>
			<span>Generate</span>
			<PaperPlane color="blue" />
		</button>
		<div class="variant-glass arrow"></div>
	</div>
	<div class="max-w-30 card absolute left-4 top-10 translate-y-1/2 rounded bg-zinc-100 text-sm">
		{#if action === 'rect' || action === 'circle'}
			<section class="p-4">
				<div class="flex flex-row items-center justify-start gap-1">
					<ColorWheel color="green" />
					<h3>Color</h3>
				</div>
				<input type="color" bind:value={stroke} />
			</section>
			<section class="p-4">
				<RangeSlider name="linewidth-slider" bind:value={lineWidth} max={5} min={1} step={1} ticked>
					<div class="flex items-center justify-between">
						<Width color="magenta" />
						<div>Line Width</div>
						<div class="text-xs">{lineWidth}</div>
					</div>
				</RangeSlider>
			</section>
			<section class="p-4">
				<div class="flex flex-row items-center justify-start gap-1">
					<BorderStyle color="black" />
					<h3>Line Type</h3>
				</div>
				<div class="flex flex-row gap-1 py-1">
					<button
						class="{lineType === 'solid'
							? 'variant-ghost-success font-semibold'
							: 'variant-soft'} chip hover:variant-ghost-success"
						onclick={() => {
							lineType = 'solid';
						}}
					>
						<BorderSolid />
					</button>
					<button
						class="{lineType === 'dotted'
							? 'variant-ghost-success font-semibold'
							: 'variant-soft'} chip hover:variant-ghost-success"
						onclick={() => {
							lineType = 'dotted';
						}}
					>
						<BorderDotted />
					</button>
					<button
						class="{lineType === 'dashed'
							? 'variant-ghost-success font-semibold'
							: 'variant-soft'} chip hover:variant-ghost-success"
						onclick={() => {
							lineType = 'dashed';
						}}
					>
						<BorderDashed />
					</button>
				</div>
			</section>
			<section class="p-4">
				<RangeSlider name="fontsize-slider" bind:value={borderRadius} max={50} min={0} step={1}>
					<div class="flex items-center justify-between">
						<CornerTopLeft color="blue" />
						<div>Border Radius</div>
						<div class="text-xs">{borderRadius}</div>
					</div>
				</RangeSlider>
			</section>
			<section class="p-4">
				<div class="flex flex-row items-center justify-start gap-1">
					<BlendingMode color="brown" />
					<h3 class="italic">Fill</h3>
				</div>
				<SlideToggle
					size="sm"
					rounded="rounded"
					name="fill-toggle"
					bind:checked={shouldFillPolygon}
				/>
			</section>
		{/if}
		{#if action === 'text'}
			<section class="p-4">
				<div class="flex flex-row items-center justify-start gap-1">
					<ColorWheel color="green" />
					<h3>Color</h3>
				</div>
				<input type="color" bind:value={stroke} />
			</section>
			<section class="p-4">
				<div class="flex flex-row items-center justify-start gap-1">
					<FontBold color="red" />
					<h3 class="font-semibold">Bold</h3>
				</div>
				<SlideToggle size="sm" rounded="rounded" name="bold-slide" bind:checked={isTextBold} />
			</section>
			<section class="p-4">
				<div class="flex flex-row items-center justify-start gap-1">
					<FontItalic color="purple" />
					<h3 class="italic">Italic</h3>
				</div>
				<SlideToggle size="sm" rounded="rounded" name="italic-slide" bind:checked={isTextItalic} />
			</section>
			<section class="p-4">
				<RangeSlider name="fontsize-slider" bind:value={fontSize} max={80} min={32} step={4} ticked>
					<div class="flex items-center justify-between">
						<FontSize color="blue" />
						<div class="font-bold">Font Size</div>
						<div class="text-xs">{fontSize}</div>
					</div>
				</RangeSlider>
			</section>
		{/if}
	</div>
	<a class="absolute left-0 top-0 p-4 text-left text-xl italic underline" href="/">Excali 🏔️</a>
	<canvas
		bind:this={canvas}
		id="canvas"
		class="inset-0 h-full min-h-0 w-full cursor-pointer"
		style="image-rendering: crisp-edges"
		onmousedown={handleMouseDown}
		onmousemove={handleMouseMove}
		onmouseup={handleMouseUp}
	>
	</canvas>
	<div class="flex shrink-0 flex-row justify-center gap-2 py-4">
		<button class="variant-soft chip hover:variant-filled-error" onclick={clearState}>
			<Eraser color="red" />
			<span>Clear</span>
		</button>
		<button class="variant-soft chip hover:variant-filled-tertiary" onclick={exportCanvas}>
			<Image color="blue" />
			<span>Export</span>
		</button>
	</div>
	<div class="absolute bottom-0 right-0 p-2">
		<button
			class="variant-glass btn-icon hover:variant-filled-tertiary"
			onclick={() => {
				const modal: ModalSettings = {
					type: 'alert',
					title: 'Hey There!',
					body: "I wanted to show that I was capable of building the prompt out given a little more time. I'm using SkeletonUI and Radix Icons for some extra visual flair. Any functionality that you see on the page should work! Hope you like it :)"
				};
				modalStore.trigger(modal);
			}}
		>
			<InfoCircled />
		</button>
	</div>
</div>
