
class Chunk {
    centerX = 50;
    centerY = 50;
    constructor(id, text) {
	this.id = id;
	this.text = text;
    }
    setCenter(x, y) {
	this.centerX = x;
	this.centerY = y;
    }
}

class FinalChunk extends Chunk {
    constructor(id, text) {
	super(id, text);
    }
}

class Question extends Chunk {
    yesChunk = null;
    noChunk = null;
    constructor(id, text) {
	super(id, text);
    }
    setYesChunk(chunk) {
	this.yesChunk = chunk;
    }
    setNoChunk(chunk) {
	this.noChunk = chunk;
    }
}

class State extends Chunk {
    nextChunk = null;
    constructor(id, text) {
	super(id, text);
    }
    setNextChunk(chunk) {
	this.nextChunk = chunk;
    }
}

export { FinalChunk, Question, State };

    
    
