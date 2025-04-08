class Context {
  constructor(timeout = null, marker = null) {
    this.timeout = timeout;
    this.marker = marker;
  }

  childWithAggPromise(otherPromise = null) {
    if (otherPromise == null) {
      return this;
    }
    if (this.timeout == null) {
      return new Context(otherPromise, this.marker);
    }
    return new Context(Promise.race([this.timeout, otherPromise]), this.marker);
  }

  childWithMarker(newMarker = null) {
    if (newMarker == null) {
      return this;
    }
    return new Context(this.timeout, newMarker);
  }
}

class MyDayRunner {
  constructor(face, startChunk) {
    this.face = face;
    this.startChunk = startChunk;
  }

  async run() {
    this.face.registerTask(Promise.resolve("marker"), [], "top", null);
    let startContext = new Context();
    await this.runChunk(this.startChunk, startContext);
  }

  async runChunk(aChunk, context) {
    if (aChunk.isTop) {
      context = context.childWithMarker("top");
    }
    await aChunk.do(this, context);
    await aChunk.doPostTimeout(this, context);
  }

  async runInParallel(endTime, chunks, context) {
    for (const chunk of chunks) {
      this.face.registerTask(
        Promise.resolve("marker"),
        [],
        chunk.makeMarker(),
        context.marker,
      );
    }
    let [timeout, cancel] = this.face.getShortCircuit(endTime);
    context = context.childWithAggPromise(timeout);
    let promiseArray = [context.timeout];
    for (const chunk of chunks) {
      let childContext = context.childWithMarker(chunk.makeMarker());
      let promise = this.runUnderCancel(chunk, childContext, cancel);
      promiseArray.push(promise);
    }
    let promises = Promise.race(promiseArray);
    try {
      let result = await promises;
      if (result == "reset") {
        throw "reset";
      }
      return result;
    } catch (error) {
      if (error != "done") {
        throw error;
      }
    }
  }
  async runUnderCancel(chunk, context, cancel) {
    try {
      await this.runChunk(chunk, context);
    } catch (error) {
      if (error != "done") {
        throw error;
      }
    }
    cancel("done");
  }
}

export default MyDayRunner;
