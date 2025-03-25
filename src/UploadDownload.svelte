<script>
  import { stringifyData, chunksFromJSON } from "./json.js";

  export let chunks;
  export let startChunk;

  $: url = makeDownloadURL(chunks, startChunk);

  function makeDownloadURL(chunks, startChunk) {
    const blob = new Blob([stringifyData(chunks, startChunk)], {
      type: "application/json",
    });
    return URL.createObjectURL(blob);
  }

  let files;
  function upload() {
    const reader = new FileReader();
    reader.onload = (evt) => {
      let txt = evt.target.result;
      [chunks, startChunk] = chunksFromJSON(txt);
    };
    reader.readAsText(files[0]);
  }
</script>

<a href={url} download={`schedule.json`}> Download This Plan </a>
<input id="myfiles" type="file" accept=".json" bind:files />
{#if files}
  <button on:click={upload}>Upload</button>
{/if}
