<script>
  import { onMount, onDestroy, tick } from "svelte";
  import { isAfterTime, timeStringToMinutes } from "./timeutil.js";
  import MyDayRunner from "./runner.js";

  export let startChunk;

  let errorState = false;
  let now = new Date();
  let today = new Date();

  function todayStrFromDate(day) {
    return day.toDateString();
  }

  $: todayStr = todayStrFromDate(today);
  function checkToday() {
    if (new Date().getDate() != today.getDate()) {
      today = new Date();
    }
  }

  function getNowDateKey(day) {
    return `donethings_${day}`;
  }

  $: todayKey = getNowDateKey(todayStr);

  function getNowStr(now) {
    let s = now.toTimeString();
    let fields = s.split(" ");
    return fields[0];
  }

  $: nowStr = getNowStr(now);

  function getNow() {
    let fields = nowStr.split(":");
    for (let j = 0; j < 3; ++j) {
      if (fields[j].length != 2) {
        throw "bad time string";
      }
    }
    return [parseInt(fields[0]), parseInt(fields[1]), parseInt(fields[2])];
  }

  class Interface {
    constructor() {
      this.timeoutResolutions = [];
    }

    registerTask(thePromise, buttons, text, marker = null) {
      let index = -1;
      if (marker != null) {
        index = tasks.findIndex((c) => c.text == marker);
      }
      if (index == -1) {
        index = tasks.length;
      }
      tasks.splice(index, 0, {
        promise: thePromise,
        buttons: buttons,
        text: text,
      });
      tasks = tasks;
    }

    async clearTimeouts() {
      for (const obj of this.timeoutResolutions) {
        obj.clear();
      }
      this.timeoutResolutions = [];
      await tick();
    }

    async runNewDay(key) {
      await this.clearTimeouts();
      tasks = [];
      savedResults = this.resultsFromStorage(key);
      try {
        await runDayToDo(key);
      } catch (error) {
        if (error != "reset") {
          errorState = true;
          throw error;
        }
      }
    }

    resultsFromStorage(key) {
      let storageString = localStorage.getItem(key);
      if (storageString) {
        let results = JSON.parse(storageString);
        return results;
      }
      return {};
    }

    async checkTimeouts(__) {
      while (true) {
        let doneArray = [];
        let notDoneArray = [];
        for (const obj of this.timeoutResolutions) {
          if (isAfterTime(obj.when)) {
            doneArray.push(obj);
          } else {
            notDoneArray.push(obj);
          }
        }
        if (doneArray.length > 0) {
          this.timeoutResolutions = notDoneArray;
          for (const obj of doneArray) {
            obj.resolve();
          }
          await tick();
        } else {
          return;
        }
      }
    }

    wasAfterTime(aTime, token) {
      let result = this.checkPriorResults(token);
      if (result == null) {
        result = isAfterTime(aTime);
        this.setPriorResults(token, result);
      }
      return result;
    }

    checkPriorResults(text) {
      if (text in savedResults) {
        if (savedResults[text] == "timeout") return null;
        return savedResults[text];
      }
      return null;
    }

    setPriorResults(text, result) {
      savedResults[text] = result;
      let s = JSON.stringify(savedResults);
      localStorage.setItem(todayKey, s);
    }

    async waitForButtonResponse(questionText, responses, context) {
      let response = this.checkPriorResults(questionText);
      if (response == null || response == "timeout") {
        response = await this.waitAnswerButton(
          questionText,
          context,
          responses,
        );
        this.setPriorResults(questionText, response);
      }
      return response;
    }

    async waitQuestion(questionText, context) {
      return await this.waitForButtonResponse(
        questionText,
        ["yes", "no"],
        context,
      );
    }

    async waitForDone(label, context) {
      return await this.waitForButtonResponse(label, ["done"], context);
    }

    async setCurrent(label, endTime = null, context) {
      let result = this.checkPriorResults(label);
      if (result == null) {
        await tick();
        if (endTime != null) {
          context = context.childWithAggPromise(this.waitEndTime(endTime));
        }
        result = await this.waitButton(label, context);
        this.setPriorResults(label, result);
      }
      return result;
    }

    async setFinal(label, context) {
      context = context.childWithAggPromise(this.finalCancel());
      this.registerTask(context.timeout, [], label, context.marker);
      await context.timeout;
    }

    waitEndTime(endTime) {
      if (isAfterTime(endTime)) {
        return Promise.resolve("timeout");
      }
      const myPromise = new Promise((resolve, reject) => {
        this.timeoutResolutions.push(new TimeoutResolution(endTime, resolve));
      });
      return myPromise;
    }

    finalCancel() {
      const myPromise = new Promise((resolve, reject) => {
        this.timeoutResolutions.push(new TimeoutResolution("99:99", reject));
      });
      return myPromise;
    }

    getShortCircuit(endTime = "99:99") {
      let rejection = null;
      let promise = new Promise((resolve, reject) => {
        this.timeoutResolutions.push(new TimeoutResolution(endTime, resolve));
        rejection = reject;
      });
      return [promise, rejection];
    }

    async waitButton(text, context) {
      let buttons = [];
      let justButtonPromise = new Promise((resolve, reject) => {
        buttons.push({
          text: "click when completed",
          action: () => resolve("click"),
        });
      });
      context = context
        .childWithAggPromise(justButtonPromise)
        .childWithAggPromise(this.finalCancel());
      this.registerTask(context.timeout, buttons, text, context.marker);
      let response = await context.timeout;
      return response;
    }

    async waitAnswerButton(questionText, context, responses = ["yes", "no"]) {
      let buttons = [];
      let buttonPromise = new Promise((resolve, reject) => {
        for (const r of responses) {
          buttons.push({ text: r, action: () => resolve(r) });
        }
      });
      context = context
        .childWithAggPromise(buttonPromise)
        .childWithAggPromise(this.finalCancel());
      this.registerTask(context.timeout, buttons, questionText, context.marker);
      let response = await context.timeout;
      return response;
    }
  }

  let face = new Interface();

  let savedResults = null;

  let tasks = [];

  async function runDayToDo(key) {
    let run = new MyDayRunner(face, startChunk);
    await run.run();
  }

  $: face.runNewDay(todayKey);

  onDestroy(() => {
    face.clearTimeouts();
  });

  onMount(() => {
    const interval = setInterval(() => {
      checkToday();
      now = new Date();
    }, 1000 * 15);
    return () => clearInterval(interval);
  });

  $: face.checkTimeouts(now);

  class TimeoutResolution {
    constructor(when, resolution) {
      this.when = when;
      this.resolution = resolution;
    }
    clear() {
      this.resolution("reset");
    }
    resolve() {
      this.resolution("timeout");
    }
  }

  let showConfirm = false;

  async function resetWhatsDone() {
    localStorage.removeItem(todayKey);
    showConfirm = false;
    await tick();
    todayStr = todayStr;
  }
</script>

<div class="container">
  {#each tasks as task}
    {#await task.promise}
      <div>
        <p>
          {task.text}
        </p>
        {#if task.buttons}
          <p>
            {#each task.buttons as button}
              <button onclick={button.action} class="clicky"
                >{button.text}</button
              >
            {/each}
          </p>
        {/if}
      </div>
      <hr />
    {:catch error}
      <p class="invisible">
        not done: {task.text}
      </p>
    {/await}
  {/each}

  {nowStr}
  {todayStr}
  {#if showConfirm}
    <span class="subtle"> Are you sure? Really reset? </span>
    <button class="subtle" on:click={(e) => (showConfirm = false)}>
      No, Don't Reset</button
    >
    <button class="subtle" on:click={resetWhatsDone}> Yes</button>
  {:else}
    <button class="subtle" on:click={(e) => (showConfirm = true)}>
      Reset
    </button>
  {/if}
</div>
{#if errorState}
  <p class="errorStateClass">stop</p>
{/if}

<style>
  .invisible {
    display: none;
  }
  .errorStateClass {
    color: red;
    font-size: 66px;
    font-weight: bold;
  }
  * {
    background-color: #004225;
    color: #ffebcd;
    font-family: "Playwrite HR Lijeva", cursive;
  }
  .subtle {
    font-family: system-ui, Avenir, Helvetica, Arial, sans-serif;
    border: none;
  }
  hr {
    border: 2px solid #ffebcd;
  }
  button {
    border-radius: 50%;
    border: 2px solid #ffebcd;
    padding: 5px 20px;
    margin: 4px;
  }
  p {
    margin: auto;
    text-align: center;
  }
  div {
    margin: auto;
    padding: 20px 2px;
  }
  .container {
    margin: 0px;
    height: 100svh;
  }
</style>
