<script>
  export let chunks;
  export let startChunk;
  export let updateChunks;
  import UploadDownload from "./UploadDownload.svelte";

  import * as chunkClasses from "./chunkclass.js";
  Object.entries(chunkClasses).forEach(
    ([name, exported]) => (window[name] = exported),
  );

  function addState(chunkClass) {
    const newChunk = new chunkClass("unnamed");
    if (selectedItem) {
      newChunk.setCenter(selectedItem.centerX - 25, selectedItem.centerY + 75);
    } else {
      newChunk.setCenter(scrollLeft + 50, scrollTop + 50);
    }
    chunks.push(newChunk);
    updateChunks(chunks);
  }

  let box;
  let scrollTop = 0;
  let scrollLeft = 0;
  function parseScroll() {
    scrollTop = box.scrollTop;
    scrollLeft = box.scrollLeft;
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

  function makeFeatureId(chunk, shape, detailId) {
    return `${chunk.id}${shape}${detailId}`;
  }

  function parseFeatureId(s, shape) {
    let fields = s.split(shape);
    if (fields.length < 2) return [null, null];
    return [fields[0], fields[1]];
  }

  function mouseDown(event) {
    if (event.srcElement) {
      let item = event.srcElement;
      while (true) {
        if (!item || item.tagName == "svg") {
          selectedItem = null;
          break;
        }
        if (item.tagName == "circle") {
          let [chunkId, portNum] = parseFeatureId(item.id, item.tagName);
          arrowOrigin = chunks.find((c) => c.id == chunkId);
          if (arrowOrigin) {
            arrowOriginPort = portNum;
            arrowStartPoint = arrowOrigin.getPorts()[portNum];
          }
          break;
        }
        if (item.tagName == "ellipse") {
          let [id, _] = parseFeatureId(item.id, item.tagName);
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
      let targetFound = false;
      arrowEndPoint = { x: event.offsetX, y: event.offsetY };
      let endTarget = event.srcElement;
      if (endTarget.tagName == "circle") {
        let [chunkId, portNum] = parseFeatureId(
          endTarget.id,
          endTarget.tagName,
        );
        if (chunkId) {
          arrowTarget = chunks.find((c) => c.id == chunkId);
          arrowTargetPort = portNum;
          targetFound = true;
        }
      }
      if (!targetFound) {
        arrowTarget = null;
        arrowTargetPort = null;
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

  function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  let daysOfWeek = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];
</script>

<UploadDownload bind:startChunk bind:chunks />
<div class="designSpace hideOnMobile">
  <div
    class="canvas"
    style="overflow:scroll;max-height:70vmin"
    width="95%"
    bind:this={box}
    on:scroll={parseScroll}
  >
    <svg
      height="2000px"
      width="3000px"
      on:mousedown={mouseDown}
      on:mousemove={mouseMove}
      on:mouseup={mouseUp}
    >
      {#each chunks as chunk (chunk.id)}
        <svelte:element
          this={chunk.shape}
          class={[
            chunk == startChunk && "start_chunk",
            chunk == selectedItem && "selected_chunk",
            chunk.isTop && "top_chunk",
          ]}
          x={chunk.centerX - chunk.sizeX / 2}
          y={chunk.centerY - chunk.sizeY / 2}
          width={chunk.sizeX}
          height={chunk.sizeY}
          rx={chunk.rx}
          ry={chunk.ry}
          points={chunk.getPoints()}
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
            class={[chunk == arrowTarget && i == arrowTargetPort && "target"]}
            id={makeFeatureId(chunk, "circle", i)}
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
          id={makeFeatureId(chunk, "ellipse", 0)}
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
      <br />
      <label for="topcheck">Pin to Top:</label>
      <input
        id="topcheck"
        type="checkbox"
        bind:checked={selectedItem.isTop}
        on:input={didChange}
      />
      <br />
      {#each daysOfWeek as day}
        <label for={day}>{capitalize(day)}</label>
        <input
          id={day}
          type="checkbox"
          bind:checked={selectedItem[day]}
          on:input={didChange}
        />
      {/each}

      <br />
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
  rect,
  polygon {
    fill: white;
    stroke: black;
    stroke-width: 1px;
  }
  .start_chunk {
    fill: orange;
  }
  .selected_chunk {
    stroke: purple;
    stroke-width: 3px;
  }
  .top_chunk {
    fill: #ffe6ff;
  }
  circle {
    fill: lightGrey;
  }
  circle.target {
    fill: green;
  }
  @media only screen and (max-width: 1000px) {
    div.hideOnMobile {
      display: none;
    }
  }
</style>
