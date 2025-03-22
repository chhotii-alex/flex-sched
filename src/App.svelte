<script>
  import { onMount } from 'svelte';
  import Counter from './lib/Counter.svelte'
  import * as chunkClasses from './chunkclass.js';
  Object.entries(chunkClasses).forEach(([name, exported]) => window[name] = exported);


  const isBrowser = typeof window !== "undefined";

  let tab = "design";
  let chunks = [];
  
  let nextId = 1;
  function updateId(otherId) {
    nextId = otherId + 1;
  }
  function getNextId() {
    let result = nextId;
    nextId++;
    return result;
  }

  function makeBlank() {
    const newChunk = new FinalChunk(getNextId(), "Design\nmy day!");
    return [newChunk];
  }

  function addState(chunkClass) {
    const newChunk = new chunkClass(getNextId(), "unnamed");
    chunks.push(newChunk);
    chunks = chunks;
  }

  function chunksFromStorage() {
    if (!isBrowser) return null;
    if (!localStorage.getItem("chunks")) {
      return makeBlank();
    }
    let s = localtStorage.getItem("chunks");
    let basics = JSON.parse(s);
    let chunksById = {};
    let newChunks = [];
    for (let oo of basics) {
       let id = oo.id;
       updateId(id);
       let text = oo.text;
       let chunk = new window[oo.className](id, text);
       chunksById[id] = chunk;
       chunk.setCenter(oo.x, oo.y);
       newChunks.push(chunk);
    }
    for (let oo of basics) {
      let chunk = chunksById[oo.id];
      if (oo.yesChunkId) {
         chunk.setYesChunk(chunksById[oo.yesChunkId]);
	 }
      if (oo.noChunkId) {
         chunk.setNoChunk(chunksById[oo.noChunkId]);
      }
      if (oo.nextChunkId) {
         chunk.setNextChunk(chunksById[oo.nextChunkId]);
      }
    }
    return newChunks;
  }

  onMount(() => {
    chunks = chunksFromStorage();
    });

  let selectedItem = null;
  let itemBeingDragged = null;

  function mouseDown(event) {
    if (event.srcElement) {
      let item = event.srcElement;
      while (true) {
        console.log(item?.tagName);
        if (!item || item.tagName == "svg") {
	  selectedItem = null;
	  break;
	}
        if (item.tagName == 'rect') {
          selectedItem = chunks.find(c => c.id == item.id);
          itemBeingDragged = selectedItem;
	  break;
        }
	else {
	  item = item.parent;
	}
      }
    }
  }

  function mouseMove(event) {
    if (!itemBeingDragged) return;
    itemBeingDragged.setCenter(event.offsetX, event.offsetY);
    selectedItem = selectedItem;
    chunks = chunks;
  }

  function mouseUp(event) {
    itemBeingDragged = null;
  }

</script>

<main>
  {#if tab == "design"}
    <h2>Design Mode</h2>
    <svg height="70vmin" width="90%" 
      on:mousedown={mouseDown} on:mousemove={mouseMove}
      on:mouseup={mouseUp} >
    {#each chunks as chunk (chunk.id)}
       <rect x={chunk.centerX - 50} y={chunk.centerY- 50} width="100" height="100" stroke="black" fill="white"
         id={chunk.id}/>
       {#each chunks as chunk (chunk.id)}
      	 {#each chunk.text.split(" ") as text, i}
           <text x={chunk.centerX} y={chunk.centerY + 20*i} text-anchor="middle"
	     pointer-events="none" >
             {text}
            </text>
         {/each}
	 {#if chunk == selectedItem}
            <rect x={selectedItem.centerX - 50} y={selectedItem.centerY- 50} width="100" height="100" stroke="purple" stroke-width="3" fill-opacity="0.0"/>
	 {/if}
       {/each}
    {/each}
    </svg>
    <div>
      {#each Object.entries(chunkClasses) as [name, oneClass]}
        <button on:click={e => addState(oneClass)} >
         Add { name }
        </button>
      {/each}
    </div>
  {:else}
    <h2>Run Mode</h2>
  {/if}
</main>

<style>
  svg {
    background-color: beige;
  }
  .logo {
    height: 6em;
    padding: 1.5em;
    will-change: filter;
    transition: filter 300ms;
  }
  .logo:hover {
    filter: drop-shadow(0 0 2em #646cffaa);
  }
  .logo.svelte:hover {
    filter: drop-shadow(0 0 2em #ff3e00aa);
  }
  .read-the-docs {
    color: #888;
  }
</style>
