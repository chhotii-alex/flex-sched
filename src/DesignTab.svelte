<script>
  export let chunks;
  export let startChunk;
  export let updateChunks;

  import * as chunkClasses from "./chunkclass.js";
  Object.entries(chunkClasses).forEach(
    ([name, exported]) => (window[name] = exported),
  );

  function addState(chunkClass) {
    const newChunk = new chunkClass("unnamed");
    if (selectedItem) {
      newChunk.setCenter(selectedItem.centerX - 25, selectedItem.centerY + 75);
    }
    chunks.push(newChunk);
    updateChunks(chunks);
  }

  let selectedItem = null;
  let itemBeingDragged = null;
  let arrowStartPoint = null;
  let arrowOrigin = null;
  let arrowOriginPort = null;
  let arrowEndPoint = null;
  let arrowTarget = null;
  let arrowTargetPort = null;
  let resizingItem = null;

  function mouseDown(event) {
    if (event.srcElement) {
      let item = event.srcElement;
      while (true) {
        if (!item || item.tagName == "svg") {
          selectedItem = null;
          break;
        }
        if (item.tagName == "circle") {
          let fields = item.id.split("_port");
          if (fields.length < 2) break;
          arrowOrigin = chunks.find((c) => c.id == fields[0]);
          arrowOriginPort = fields[1];
          arrowStartPoint = arrowOrigin.getPorts()[arrowOriginPort];
          break;
        }
        if (item.tagName == "ellipse") {
          let id = item.id.substring(6);
          if (id) {
            resizingItem = chunks.find((c) => c.id == id);
          }
          break;
        }
        if (item.tagName == "rect" || item.tagName == "polygon") {
          selectedItem = chunks.find((c) => c.id == item.id);
          itemBeingDragged = selectedItem;
          break;
        } else {
          item = item.parent;
        }
      }
    }
  }

  function mouseMove(event) {
    if (itemBeingDragged) {
      itemBeingDragged.setCenter(event.offsetX, event.offsetY);
    } else if (arrowOrigin) {
      arrowEndPoint = { x: event.offsetX, y: event.offsetY };
      let endTarget = event.srcElement;
      if (endTarget.tagName == "circle") {
        let fields = endTarget.id.split("_port");
        if (fields.length == 2) {
          arrowTarget = chunks.find((c) => c.id == fields[0]);
          arrowTargetPort = fields[1];
        }
      }
    } else if (resizingItem) {
      if (event.offsetX > resizingItem.centerX) {
        resizingItem.sizeX = (event.offsetX - resizingItem.centerX) * 2;
      }
      if (event.offsetY > resizingItem.centerY) {
        resizingItem.sizeY = (event.offsetY - resizingItem.centerY) * 2;
      }
    }
    updateChunks(chunks);
  }

  function completeArrow() {
    if (!arrowOrigin) return;
    if (!arrowTarget) return;
    if (arrowTarget == arrowOrigin) return;
    if (arrowTargetPort == arrowOriginPort) return;
    if (arrowTargetPort == 0) {
      //ok
    } else if (arrowOriginPort == 0) {
      [arrowOrigin, arrowOriginPort, arrowTarget, arrowTargetPort] = [
        arrowTarget,
        arrowTargetPort,
        arrowOrigin,
        arrowOriginPort,
      ];
    } else {
      return;
    }
    arrowOrigin.setTarget(arrowOriginPort, arrowTarget);
    updateChunks(chunks);
  }

  function mouseUp(event) {
    if (arrowOrigin) {
      completeArrow();
    }
    itemBeingDragged = null;
    arrowOrigin = null;
    arrowStartPoint = null;
    arrowEndPoint = null;
    arrowTarget = null;
    resizingItem = null;
  }

  function didChange(event) {
    updateChunks(chunks);
  }

  function canBeDeleted(otherChunk) {
    if (otherChunk == startChunk) return false;
    for (let chunk of chunks) {
      if (chunk.pointsToChunk(otherChunk)) return false;
    }
    return true;
  }

  function deleteItem() {
    updateChunks(chunks.filter((c) => c != selectedItem));
  }
</script>

<h2>Design Mode</h2>
<div class="designSpace">
  <div class="canvas" style="overflow:scroll;max-height:70vmin" width="95%">
    <svg
      height="2000px"
      width="2000px"
      on:mousedown={mouseDown}
      on:mousemove={mouseMove}
      on:mouseup={mouseUp}
    >
      {#each chunks as chunk (chunk.id)}
        <svelte:element
          this={chunk.shape}
          x={chunk.centerX - chunk.sizeX / 2}
          y={chunk.centerY - chunk.sizeY / 2}
          width={chunk.sizeX}
          height={chunk.sizeY}
          rx={chunk.rx}
          ry={chunk.ry}
          points={chunk.getPoints()}
          stroke={chunk == selectedItem ? "purple" : "black"}
          stroke-width={chunk == selectedItem ? "3" : "1"}
          fill={chunk == startChunk ? "orange" : "white"}
          id={chunk.id}
        />
        {#each chunk.text.split("\n") as text, i}
          <text
            x={chunk.centerX}
            y={chunk.centerY + 20 * i}
            text-anchor="middle"
            pointer-events="none"
          >
            {text}
          </text>
        {/each}
        {#each chunk.getPorts() as port, i}
          <circle
            r="10"
            cx={port.x}
            cy={port.y}
            fill={chunk == arrowTarget && i == arrowTargetPort
              ? "green"
              : "lightGrey"}
            id={`${chunk.id}_port${i}`}
          />
          {#if port.label}
            <text
              x={port.x}
              y={port.y + 5}
              text-anchor="middle"
              fill="black"
              pointer-events="none"
            >
              {port.label}
            </text>
          {/if}
          {#each chunk.ports as port}
            {#if !port.isInput && port.target}
              <line
                x1={port.getX()}
                y1={port.getY()}
                x2={port.target.ports[0].getX()}
                y2={port.target.ports[0].getY()}
                stroke="green"
              />
            {/if}
          {/each}
        {/each}
        <ellipse
          cx={chunk.centerX + chunk.sizeX / 2}
          cy={chunk.centerY + chunk.sizeY / 2}
          rx="6"
          ry="4"
          fill="black"
          id={`sizer_${chunk.id}`}
        />
      {/each}
      {#if arrowStartPoint && arrowEndPoint}
        <line
          x2={arrowStartPoint.x}
          y2={arrowStartPoint.y}
          x1={arrowEndPoint.x}
          y1={arrowEndPoint.y}
          stroke="black"
        />
      {/if}
    </svg>
  </div>
  <div class="inspector">
    <h2>Inspector</h2>
    {#if selectedItem}
      <p>
        {selectedItem.constructor.name}
      </p>
      <textarea bind:value={selectedItem.text} rows="5" on:input={didChange}>
      </textarea>
      {#if selectedItem != startChunk}
        <button on:click={() => (startChunk = selectedItem)}>
          Set Start
        </button>
      {/if}
      <input
        type="time"
        bind:value={selectedItem.endTime}
        on:input={didChange}
      />
      {#if canBeDeleted(selectedItem)}
        <button on:click={deleteItem}>Delete</button>
      {/if}
    {/if}
  </div>
  <div class="buttons">
    {#each Object.entries(chunkClasses) as [name, oneClass]}
      <button on:click={(e) => addState(oneClass)}>
        Add {name}
      </button>
    {/each}
  </div>
</div>

<style>
  div.designSpace {
    display: grid;
    grid-template-columns: 4fr 1fr;
  }
  svg {
    background-color: beige;
  }
</style>
