<script>
  import { onMount } from 'svelte';
  import DesignTab from './DesignTab.svelte';

  const isBrowser = typeof window !== "undefined";

  let tab = "design";
  let chunks = [];
  let startChunk = null;
  
  $: url = makeDownloadURL(chunks, startChunk);

  function makeDownloadURL() {
     const blob = new Blob([stringifyData()], {
            type: "application/json",
        });
        return URL.createObjectURL(blob);
  }

  let files;
  function upload() {
    const reader = new FileReader();
        reader.onload = (evt) => {
            let txt = evt.target.result;
	    chunks = chunksFromJSON(txt);
        };
        reader.readAsText(files[0]);
  }

  function makeBlank() {
    const newChunk = new FinalChunk("Design\nmy day!");
    return [newChunk];
  }

  function stringifyData() {
        let basics = [];
      for (let chunk of chunks) {
        let oo = {id: chunk.id, text: chunk.text,
	    className: chunk.constructor.name,
	  x:chunk.centerX, y:chunk.centerY,
	  dx:chunk.sizeX, dy:chunk.sizeY,
	  endTime:chunk.endTime};
	if (chunk == startChunk) {
	  oo.isStartChunk = true;
	}
	for (let tag of ["yesChunk", "noChunk", "nextChunk", "subChunk1",
	   "subChunk2", "followingChunk"]) {
	   if (chunk[tag]) {
	     oo[tag] = chunk[tag].id;
	   }
	}
	basics.push(oo);
      }
      return JSON.stringify(basics);
   }

  function updateChunks(newChunks) {
    chunks = newChunks;
    if (isBrowser) {
      let s = stringifyData();
      localStorage.setItem("chunks", s);
    }
  }

  function chunksFromJSON(s) {
    let basics = JSON.parse(s);
    if (!basics.length) return makeBlank();
    let chunksById = {};
    let newChunks = [];
    for (let oo of basics) {
       let id = oo.id;
       let text = oo.text;
       let chunk = new window[oo.className](text, id);
       chunksById[id] = chunk;
       chunk.setCenter(oo.x, oo.y);
       chunk.endTime = oo.endTime;
       if (oo.dx && oo.dy) {
         chunk.setSize(oo.dx, oo.dy);
	 }
       newChunks.push(chunk);
       if (oo.isStartChunk) {
         startChunk = chunk;
       }
    }
    for (let oo of basics) {
      let chunk = chunksById[oo.id];
      if (oo.yesChunk) {
         chunk.setYesChunk(chunksById[oo.yesChunk]);
	 }
      if (oo.noChunk) {
         chunk.setNoChunk(chunksById[oo.noChunk]);
      }
      if (oo.nextChunk) {
         chunk.setNextChunk(chunksById[oo.nextChunk]);
      }
      if (oo.subChunk1) {
        chunk.setNextChunk(chunksById[oo.subChunk1], 1);
      }
      if (oo.subChunk2) {
        chunk.setNextChunk(chunksById[oo.subChunk2], 2);
      }
      if (oo.followingChunk) {
        chunk.setNextChunk(chunksById[oo.followingChunk], 3);
      }
    }
    return newChunks;
  }

  function chunksFromStorage() {
    if (!isBrowser) return null;
    if (!localStorage.getItem("chunks")) {
      return makeBlank();
    }
    let s = localStorage.getItem("chunks");
    return chunksFromJSON(s);
  }

  onMount(() => {
    chunks = chunksFromStorage();
    });

</script>

<main>
    <a href={url} download={`schedule.json`}>
            Download This Plan
        </a>
      <input id="myfiles" type="file" accept=".json" bind:files />
      {#if files}
        <button on:click={upload}>Upload</button>
      {/if}
  {#if tab == "design"}
    <DesignTab bind:chunks={chunks} bind:startChunk={startChunk}
        {updateChunks} />
  {:else}
    <h2>Run Mode</h2>
  {/if}
</main>

<style>
</style>
