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
      () => this.getX(0),
      () => this.getY(-0.5),
      null,
      true,
    );
  }
  getX(fraction) {
    return this.centerX + fraction * this.sizeX;
  }
  getY(fraction) {
    return this.centerY + fraction * this.sizeY;
  }
  setCenter(x, y) {
    if (typeof x !== "number") throw new Error(`${x} is not a number`);
    if (typeof y !== "number") throw new Error(`${y} is not a number`);

    this.centerX = x;
    this.centerY = y;
  }
  setSize(dx, dy) {
    if (typeof dx !== "number") throw new Error(`${dx} is not a number`);
    if (typeof dy !== "number") throw new Error(`${dy} is not a number`);
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
      () => this.getX(0.25),
      () => this.getY(0.25),
      "Y",
    );
    this.addPort(
      "noChunk",
      () => this.getX(-0.25),
      () => this.getY(0.25),
      "N",
    );
  }
  getPoints() {
    return `${this.getX(0)} ${this.getY(-0.5)}
                ${this.getX(0.5)} ${this.getY(0)}
                ${this.getX(0)} ${this.getY(0.5)}
                ${this.getX(-0.5)} ${this.getY(0)}`;
  }
}

class State extends Chunk {
  nextChunk = null;
  constructor(text, id) {
    super(text, id);
    this.addPort(
      "nextChunk",
      () => this.getX(0),
      () => this.getY(0.5),
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
      () => this.getX(-0.25),
      () => this.getY(0.5),
    );
    this.addPort(
      "subChunk2",
      () => this.getX(0.25),
      () => this.getY(0.5),
    );
    this.addPort(
      "followingChunk",
      () => this.getX(0.5),
      () => this.getY(0),
    );
  }
  getPoints() {
    return `${this.getX(-0.5)} ${this.getY(-0.5)}
                    ${this.getX(0.5)} ${this.getY(-0.5)}
                    ${this.getX(0.5)} ${this.getY(0.5)}
                    ${this.getX(-0.5)} ${this.getY(0.5)}`;
  }
}

export { FinalChunk, Question, State, Parallelizer };
