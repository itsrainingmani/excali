<script lang="ts">
  import { browser } from '$app/environment';

  let canvas = null;

  let startX = 0;
  let startY = 0;
  let endX = 0;
  let endY = 0;

  let areWeDrawing = false;

  interface Rectangle {
    x: number;
    y: number;
    width: number;
    height: number;
    timestamp: Date;
  }

  // Only contains drawn rectangles
  // {x: int, y: int, width: int, height: int, timestamp: current timestamp}
  let objectStore: Rectangle[] = [];
  function drawExistingObjects(ctx) {
    if (browser) {
      for (let obj of objectStore) {
        ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
      }
    }
  }

  function getCurrentMousePosition(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    let x = (evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width;
    let y = (evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height;

    return {x: x, y: y};
  }

  function captureStartPos(evt) {
    if (browser) {
      let canvas = document.getElementById('canvas');
      let mousePos = getCurrentMousePosition(canvas, evt);
      console.log(mousePos.x, mousePos.y);
      startX = mousePos.x;
      startY = mousePos.y;
      areWeDrawing = true;
    }
  }

  function drawRectangle(evt) {
    if (browser) {
      let canvas = document.getElementById('canvas');
      let mousePos = getCurrentMousePosition(canvas, evt);
      console.log(mousePos.x, mousePos.y);
      endX = mousePos.x;
      endY = mousePos.y;

      const ctx = canvas.getContext('2d');
      ctx.lineWidth = 1;

      let width = endX - startX;
      let height = endY - startY;

      if (areWeDrawing) {
        ctx.strokeRect(startX, startY, width, height);
      }
    }
  }

  function finalizeObject(evt) {
    if (browser) {
      let canvas = document.getElementById('canvas');
      let mousePos = getCurrentMousePosition(canvas, evt);
      const ctx = canvas.getContext('2d');
      ctx.lineWidth = 1;
      console.log(mousePos.x, mousePos.y);
      let width = endX - startX;
      let height = endY - startY;
      ctx.strokeRect(startX, startY, width, height);

      areWeDrawing = false;
      let currentObject: Rectangle = {
        x: startX,
        y: startY,
        width: endX - startX,
        height: endY - startY,
        timestamp: new Date(),
      }
      objectStore.push(currentObject);
    }
  }

  if (browser) {
    canvas = document.getElementById('canvas');
    console.log(canvas);
    if (canvas) {
      const ctx = canvas.getContext('2d');
      drawExistingObjects(ctx);
    }
  }
</script>

<canvas id="canvas" class="w-full h-full" on:mousedown={captureStartPos} on:mousemove={drawRectangle} on:mouseup={finalizeObject}>
</canvas>