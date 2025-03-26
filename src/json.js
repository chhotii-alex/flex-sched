function makeReplacer(startChunk) {
  function replacer(key, value) {
    if (value?.isChunk) {
      let oo = { ...value };
      if (value == startChunk) {
        oo.isStartChunk = true;
      }
      for (let port of value.ports) {
        if (port.target) {
          oo[port.tag] = port.target.id;
        }
      }
      oo.ports = undefined;
      oo.className = value.constructor.name;
      return oo;
    }
    return value;
  }
  return replacer;
}

export function stringifyData(chunks, startChunk) {
  return JSON.stringify(chunks, makeReplacer(startChunk), 2);
}

export function chunksFromJSON(s) {
  let basics = JSON.parse(s);
  if (!basics.length) throw new Error("invalid chunks json");
  let chunksById = {};
  let newChunks = [];
  let startChunk = null;
  for (let oo of basics) {
    let id = oo.id;
    let text = oo.text;
    let chunk = new window[oo.className](text, id);
    chunksById[id] = chunk;
    chunk.setCenter(oo.centerX, oo.centerY);
    chunk.endTime = oo.endTime;
    chunk.setSize(oo.sizeX, oo.sizeY);
    chunk.isTop = oo.isTop;
    for (let day of [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ]) {
      if (oo[day] !== undefined) {
        chunk[day] = oo[day];
      }
    }
    newChunks.push(chunk);
    if (oo.isStartChunk) {
      startChunk = chunk;
    }
  }
  for (let oo of basics) {
    let chunk = chunksById[oo.id];
    for (let tag of chunk.ports.map((p) => p.tag)) {
      if (oo[tag]) {
        let otherChunk = chunksById[oo[tag]];
        chunk.setTargetForTag(tag, otherChunk);
      }
    }
  }
  return [startChunk, newChunks];
}
