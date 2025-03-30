<script>
  import { onMount } from "svelte";
  import DesignTab from "./DesignTab.svelte";
  import DailySched from "./DailySched.svelte";
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

  $: updateChunks(chunks, startChunk);

  function updateChunks(newChunks, newStartChunk) {
    if (isBrowser) {
      let s = stringifyData(newChunks, newStartChunk);
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

{#if tab == "design"}
  <DesignTab bind:chunks bind:startChunk {updateChunks} />
{:else}
  <DailySched {startChunk} />
{/if}
{#if tab != "run"}
  <button on:click={() => (tab = "run")}>Run Mode</button>
{/if}
{#if tab != "design"}
  <button on:click={() => (tab = "design")}>Design Mode</button>
{/if}

<style>
</style>
