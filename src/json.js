export function stringifyData(chunks, startChunk) {
  let basics = [];
  for (let chunk of chunks) {
    let oo = {
      id: chunk.id,
      text: chunk.text,
      className: chunk.constructor.name,
      x: chunk.centerX,
      y: chunk.centerY,
      dx: chunk.sizeX,
      dy: chunk.sizeY,
      endTime: chunk.endTime,
    };
    if (chunk == startChunk) {
      oo.isStartChunk = true;
    }
    for (let tag of [
      "yesChunk",
      "noChunk",
      "nextChunk",
      "subChunk1",
      "subChunk2",
      "followingChunk",
    ]) {
      if (chunk[tag]) {
        oo[tag] = chunk[tag].id;
      }
    }
    basics.push(oo);
  }
  return JSON.stringify(basics);
}

export function chunksFromJSON(s) {
  let basics = JSON.parse(s);
  if (!basics.length) return makeBlank();
  let chunksById = {};
  let newChunks = [];
  let startChunk = null;
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
  return [startChunk, newChunks];
}
