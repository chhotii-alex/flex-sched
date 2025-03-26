<script>
  import { onMount } from "svelte";
  import DesignTab from "./DesignTab.svelte";
  import UploadDownload from "./UploadDownload.svelte";
  import { stringifyData, chunksFromJSON } from "./json.js";
  import { FinalChunk } from "./chunkclass.js";

  const isBrowser = typeof window !== "undefined";

  let tab = "design";
  let chunks = [];
  let startChunk = null;

  function makeBlank() {
    const newChunk = new FinalChunk("Design\nmy day!");
    return [newChunk];
  }

  function updateChunks(newChunks) {
    chunks = newChunks;
    if (isBrowser) {
      let s = stringifyData(chunks, startChunk);
      localStorage.setItem("chunks", s);
    }
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
    try {
      [startChunk, chunks] = chunksFromStorage();
    } catch (e) {
      chunks = makeBlank();
      startChunk = null;
    }
  });
</script>

<main>
  <UploadDownload bind:startChunk bind:chunks />
  {#if tab == "design"}
    <DesignTab bind:chunks bind:startChunk {updateChunks} />
  {:else}
    <h2>Run Mode</h2>
  {/if}
</main>

<style>
</style>
