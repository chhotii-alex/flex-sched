<script>
	export let chunks;
	export let startChunk;
	export let updateChunks;

  import * as chunkClasses from './chunkclass.js';
  Object.entries(chunkClasses).forEach(([name, exported]) => window[name] = exported);

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
  let arrowOrigin = null;
  let arrowOriginPort = null;
  let arrowEnd = null;
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
	if (item.tagName == 'circle') {
	  let fields = item.id.split("_port");
	  if (fields.length < 2) break;
	  arrowOrigin = chunks.find(c => c.id == fields[0]);
	  arrowOriginPort = fields[1];
	  break;
	}
	if (item.tagName == 'ellipse') {
	  let id = item.id.substring(6);
	  if (id) {
	    resizingItem = chunks.find(c => c.id == id);
	  }		 
	  break;
	}
        if (item.tagName == 'rect' || item.tagName == 'polygon' ) {
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
    if (itemBeingDragged) {
       itemBeingDragged.setCenter(event.offsetX, event.offsetY);
       selectedItem = selectedItem;
   }
   else if (arrowOrigin) {
     arrowEnd = {x: event.offsetX, y: event.offsetY};
     let endTarget = event.srcElement;
     if (endTarget.tagName == 'circle') {
       let fields = endTarget.id.split("_port");
       if (fields.length == 2) {
       	  arrowTarget = chunks.find(c => c.id == fields[0]);
	  arrowTargetPort = fields[1];
       }
     }
   }
   else if (resizingItem) {
     if (event.offsetX > resizingItem.centerX) {
       resizingItem.sizeX = (event.offsetX - resizingItem.centerX)*2;
     }
     if (event.offsetY > resizingItem.centerY) {
       resizingItem.sizeY = (event.offsetY - resizingItem.centerY)*2;
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
	  }
	  else if (arrowOriginPort == 0) {
	    [arrowOrigin, arrowOriginPort, arrowTarget, arrowTargetPort] =
	      	    [arrowTarget, arrowTargetPort, arrowOrigin, arrowOriginPort]
	  }
	  else {
	    return;
	  }
     arrowOrigin.setTarget(arrowOriginPort, arrowTarget);
  }

  function mouseUp(event) {
    if (itemBeingDragged) {
        itemBeingDragged = null;
   }
   else if (arrowOrigin) {
     completeArrow();
     arrowOrigin = null;
     arrowEnd = null;
     arrowTarget = null;
   }
   else if (resizingItem) {
     resizingItem = null;
   }
  }

  function editText(event) {
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
     updateChunks(chunks.filter(c => c != selectedItem));
  }

</script>

    <h2>Design Mode</h2>
    <div class="designSpace" >
    <div class="canvas" style="overflow:scroll;max-height:70vmin" width="95%" >
    <svg height="2000px", width="2000px"
      on:mousedown={mouseDown} on:mousemove={mouseMove}
      on:mouseup={mouseUp} >
    {#each chunks as chunk (chunk.id)}
       <svelte:element this={chunk.shape} x={chunk.centerX - chunk.sizeX/2} y={chunk.centerY-chunk.sizeY/2} width={chunk.sizeX} height={chunk.sizeY}
         rx={chunk.rx} ry={chunk.ry}
         points={chunk.getPoints()}
         stroke={(chunk==selectedItem) ? "purple" : "black"}
	 stroke-width={(chunk==selectedItem) ? "3" : "1" }
	 fill={(chunk==startChunk)?"orange":"white"}
         id={chunk.id}/>
      	 {#each chunk.text.split("\n") as text, i}
           <text x={chunk.centerX} y={chunk.centerY + 20*i} text-anchor="middle"
	     pointer-events="none" >
             {text}
            </text>
         {/each}
	 {#each chunk.getPorts() as port, i}
	   <circle r="10" cx={port.x} cy={port.y}
	     fill={(chunk==arrowTarget && i==arrowTargetPort)?"green":"lightGrey"}
	     id={`${chunk.id}_port${i}`}/>
	   {#if port.label}
	     <text x={port.x} y={port.y+5} text-anchor="middle" fill="black"
	         pointer-events="none">
	       {port.label}
	     </text>
	   {/if}
	 {/each}
	 {#each [[1, "yesChunk"], [2, "noChunk"], [1, "nextChunk"],
	                 [1, "subChunk1"], [2, "subChunk2"], [3, "followingChunk"]]
	      as [portNum, chunkName]}
    	  {#if chunk[chunkName]}
	   <line x1={chunk.getPorts()[portNum].x}
	       y1={chunk.getPorts()[portNum].y}
	       x2={chunk[chunkName].getPorts()[0].x}
	       y2={chunk[chunkName].getPorts()[0].y}
	       stroke="green" />
	  {/if} 
	 {/each}
	 <ellipse cx={chunk.centerX+chunk.sizeX/2}
	         cy={chunk.centerY+chunk.sizeY/2}
		 rx="6"
		 ry="4"
		 fill="black"
		 id={`sizer_${chunk.id}`} />
    {/each}
    {#if arrowOrigin && arrowEnd }
      <line x2={arrowOrigin.getPorts()[arrowOriginPort].x}
            y2={arrowOrigin.getPorts()[arrowOriginPort].y}
	    x1={arrowEnd.x}
	    y1={arrowEnd.y}
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
	<textarea bind:value={selectedItem.text} rows="5" on:input={editText}>
	</textarea>
	{#if selectedItem != startChunk}
        	<button on:click={() => startChunk = selectedItem} >
	           Set Start
	        </button>
	{/if}
	<input type="time" bind:value={selectedItem.endTime} on:input={editText} />
	{#if canBeDeleted(selectedItem)}
        	<button on:click={deleteItem}>Delete</button>
	{/if}
      {/if}
    </div>
    <div class="buttons">
      {#each Object.entries(chunkClasses) as [name, oneClass]}
        <button on:click={e => addState(oneClass)} >
         Add { name }
        </button>
      {/each}
    </div>
    </div>

<style>
  div.designSpace {
    display:grid;
    grid-template-columns: 4fr 1fr;
  }
  svg {
    background-color: beige;
  }

</style>
