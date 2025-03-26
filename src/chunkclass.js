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
  isChunk = true;
  centerX = 50;
  centerY = 50;
  shape = "rect";
  endTime = null;
  ports = [];
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
    this.addPort(
      "target",
      () => this.centerX,
      () => this.centerY - this.sizeY / 2,
      null,
      true,
    );
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
  addPort(tag, getX, getY, label = null, isInput = false) {
    this.ports.push({
      tag: tag,
      getX: getX,
      getY: getY,
      label: label,
      isInput: isInput,
      target: null,
    });
  }
  getPorts() {
    return this.ports.map((p) => {
      return { x: p.getX(), y: p.getY(), label: p.label };
    });
  }
  setTarget(port, target) {
    if (port < 0 || port >= this.ports.length) return;
    if (this.ports[port].isInput) return;
    this.ports[port].target = target;
  }
  setTargetForTag(tag, target) {
    this.ports = this.ports.map((p) => {
      if (p.tag == tag) {
        let newPort = { ...p };
        newPort.target = target;
        return newPort;
      } else {
        return p;
      }
    });
  }

  pointsToChunk(otherChunk) {
    return this.ports.find((p) => p.target == otherChunk) != undefined;
  }
}

class FinalChunk extends Chunk {
  rx = 10;
  ry = 10;
  constructor(text, id) {
    super(text, id);
  }
}

class Question extends Chunk {
  constructor(text, id) {
    super(text, id);
    this.shape = "polygon";
    this.addPort(
      "yesChunk",
      () => this.centerX + this.sizeX / 4,
      () => this.centerY + this.sizeY / 4,
      "Y",
    );
    this.addPort(
      "noChunk",
      () => this.centerX - this.sizeX / 4,
      () => this.centerY + this.sizeY / 4,
      "N",
    );
  }
  getPoints() {
    return `${this.centerX} ${this.centerY - this.sizeY / 2}
                ${this.centerX + this.sizeX / 2} ${this.centerY}
                ${this.centerX} ${this.centerY + this.sizeY / 2}
                ${this.centerX - this.sizeX / 2} ${this.centerY}`;
  }
}

class State extends Chunk {
  nextChunk = null;
  constructor(text, id) {
    super(text, id);
    this.addPort(
      "nextChunk",
      () => this.centerX,
      () => this.centerY + this.sizeY / 2,
    );
  }
}

class Parallelizer extends Chunk {
  constructor(text, id) {
    super(text, id);
    this.shape = "polygon";
    this.sizeX = 200;
    this.addPort(
      "subChunk1",
      () => this.centerX - this.sizeX / 4,
      () => this.centerY + this.sizeY / 2,
    );
    this.addPort(
      "subChunk2",
      () => this.centerX + this.sizeX / 4,
      () => this.centerY + this.sizeY / 2,
    );
    this.addPort(
      "followingChunk",
      () => this.centerX + this.sizeX / 2,
      () => this.centerY,
    );
  }
  getPoints() {
    return `${this.centerX - this.sizeX / 2} ${this.centerY - this.sizeY / 2}
                    ${this.centerX + this.sizeX / 2} ${this.centerY - this.sizeY / 2}
                    ${this.centerX + this.sizeX / 2} ${this.centerY + this.sizeY / 2}
                    ${this.centerX - this.sizeX / 2} ${this.centerY + this.sizeY / 2}`;
  }
}

export { FinalChunk, Question, State, Parallelizer };
