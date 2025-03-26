<script>
  import { stringifyData, chunksFromJSON } from "./json.js";

  export let chunks;
  export let startChunk;

  let error = "";

  $: url = makeDownloadURL(chunks, startChunk);

  function makeDownloadURL(chunks, startChunk) {
    if (chunks) {
      const blob = new Blob([stringifyData(chunks, startChunk)], {
        type: "application/json",
      });
      return URL.createObjectURL(blob);
    }
  }

  let files;
  function upload() {
    const reader = new FileReader();
    reader.onload = (evt) => {
      let txt = evt.target.result;
      try {
        [startChunk, chunks] = chunksFromJSON(txt);
        error = "";
      } catch (e) {
        error = "Failed to parse file.";
      }
    };
    reader.readAsText(files[0]);
  }
</script>

{error}
{#if url}
  <a href={url} download={`schedule.json`}> Download This Plan </a>
{/if}
<input id="myfiles" type="file" accept=".json" bind:files />
{#if files}
  <button on:click={upload}>Upload</button>
{/if}
