let nextId = 1;
function updateId(otherId) {
  nextId = otherId + 1;
}
function getNextId() {
  let result = nextId;
  nextId++;
  return result;
}

class Chunk {
  centerX = 50;
  centerY = 50;
  shape = "rect";
  endTime = null;
  constructor(text, id) {
    if (!id) {
      this.id = getNextId();
    } else {
      this.id = id;
      updateId(id);
    }
    this.text = text;
    this.sizeX = 100;
    this.sizeY = 100;
  }
  setCenter(x, y) {
    this.centerX = x;
    this.centerY = y;
  }
  setSize(dx, dy) {
    this.sizeX = dx;
    this.sizeY = dy;
  }
  getPoints() {
    return null;
  }
  getPorts() {
    return [];
  }
  setTarget() {}
  pointsToChunk(otherChunk) {
    return false;
  }
}

class FinalChunk extends Chunk {
  rx = 10;
  ry = 10;
  constructor(text, id) {
    super(text, id);
  }
  getPorts() {
    return [{ x: this.centerX, y: this.centerY - this.sizeY / 2 }];
  }
}

class Question extends Chunk {
  yesChunk = null;
  noChunk = null;
  constructor(text, id) {
    super(text, id);
    this.shape = "polygon";
  }
  setYesChunk(chunk) {
    this.yesChunk = chunk;
  }
  setNoChunk(chunk) {
    this.noChunk = chunk;
  }
  getPoints() {
    return `${this.centerX} ${this.centerY - this.sizeY / 2}
                ${this.centerX + this.sizeX / 2} ${this.centerY}
                ${this.centerX} ${this.centerY + this.sizeY / 2}
                ${this.centerX - this.sizeX / 2} ${this.centerY}`;
  }
  getPorts() {
    return [
      { x: this.centerX, y: this.centerY - this.sizeY / 2 },
      {
        x: this.centerX + this.sizeX / 4,
        y: this.centerY + this.sizeY / 4,
        label: "Y",
      },
      {
        x: this.centerX - this.sizeX / 4,
        y: this.centerY + this.sizeY / 4,
        label: "N",
      },
    ];
  }
  setTarget(port, target) {
    if (port == 1) {
      this.setYesChunk(target);
    } else if (port == 2) {
      this.setNoChunk(target);
    }
  }
  pointsToChunk(otherChunk) {
    if (otherChunk == this.yesChunk) return true;
    if (otherChunk == this.noChunk) return true;
    return false;
  }
}

class State extends Chunk {
  nextChunk = null;
  constructor(text, id) {
    super(text, id);
  }
  setNextChunk(chunk) {
    this.nextChunk = chunk;
  }
  getPorts() {
    return [
      { x: this.centerX, y: this.centerY - this.sizeY / 2 },
      { x: this.centerX, y: this.centerY + this.sizeY / 2 },
    ];
  }
  setTarget(port, target) {
    if (port == 1) {
      this.setNextChunk(target);
    }
  }
  pointsToChunk(otherChunk) {
    if (otherChunk == this.nextChunk) return true;
    return false;
  }
}

class Parallelizer extends Chunk {
  subChunk1 = null;
  subChunk2 = null;
  followingChunk = null;
  constructor(text, id) {
    super(text, id);
    this.shape = "polygon";
    this.sizeX = 200;
  }
  setNextChunk(chunk, position) {
    if (position == 1) {
      this.subChunk1 = chunk;
    } else if (position == 2) {
      this.subChunk2 = chunk;
    } else if (position == 3) {
      this.followingChunk = chunk;
    }
  }
  getPoints() {
    return `${this.centerX - this.sizeX / 2} ${this.centerY - this.sizeY / 2}
                    ${this.centerX + this.sizeX / 2} ${this.centerY - this.sizeY / 2}
                    ${this.centerX + this.sizeX / 2} ${this.centerY + this.sizeY / 2}
                    ${this.centerX - this.sizeX / 2} ${this.centerY + this.sizeY / 2}`;
  }
  getPorts() {
    return [
      { x: this.centerX, y: this.centerY - this.sizeY / 2 },
      { x: this.centerX - this.sizeX / 4, y: this.centerY + this.sizeY / 2 },
      { x: this.centerX + this.sizeX / 4, y: this.centerY + this.sizeY / 2 },
      { x: this.centerX + this.sizeX / 2, y: this.centerY },
    ];
  }
  setTarget(port, target) {
    this.setNextChunk(target, port);
  }
  pointsToChunk(otherChunk) {
    if (otherChunk == this.subChunk1) return true;
    if (otherChunk == this.subChunk2) return true;
    if (otherChunk == this.followingChunk) return true;
    return false;
  }
}

export { FinalChunk, Question, State, Parallelizer };
