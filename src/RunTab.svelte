<script>
  import { onMount, tick } from "svelte";
  import DailySched from "./DailySched.svelte";
  export let chunks;
  export let startChunk;

  function nowDateStr(day) {
    return day.toDateString();
  }

  let today = new Date();
  $: nowDate = nowDateStr(today);
  function checkToday() {
    let now = new Date();
    if (now.getDate() != today.getDate()) {
      today = now;
    }
  }
  onMount(() => {
    const interval = setInterval(() => {
      checkToday();
    }, 1000 * 60);
    return () => clearInterval(interval);
  });
</script>

<h2>Run Mode</h2>
<DailySched {nowDate} {startChunk} {chunks} />
