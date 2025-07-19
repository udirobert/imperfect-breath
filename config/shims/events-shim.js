// This is a shim file to fix the events module import issues
// Simplified EventEmitter implementation for browser environments

class EventEmitter {
  constructor() {
    this._events = {};
    this._maxListeners = 10;
  }

  setMaxListeners(n) {
    this._maxListeners = n;
    return this;
  }

  getMaxListeners() {
    return this._maxListeners;
  }

  on(event, listener) {
    if (!this._events[event]) {
      this._events[event] = [];
    }
    this._events[event].push(listener);
    return this;
  }

  addListener(event, listener) {
    return this.on(event, listener);
  }

  off(event, listener) {
    if (!this._events[event]) return this;
    if (listener) {
      this._events[event] = this._events[event].filter((l) => l !== listener);
    } else {
      delete this._events[event];
    }
    return this;
  }

  removeListener(event, listener) {
    return this.off(event, listener);
  }

  removeAllListeners(event) {
    if (event) {
      delete this._events[event];
    } else {
      this._events = {};
    }
    return this;
  }

  emit(event, ...args) {
    if (!this._events[event]) return false;
    this._events[event].forEach((listener) => listener.apply(this, args));
    return true;
  }

  once(event, listener) {
    const onceWrapper = (...args) => {
      listener.apply(this, args);
      this.off(event, onceWrapper);
    };
    this.on(event, onceWrapper);
    return this;
  }

  listenerCount(event) {
    if (!this._events[event]) return 0;
    return this._events[event].length;
  }

  listeners(event) {
    if (!this._events[event]) return [];
    return [...this._events[event]];
  }

  eventNames() {
    return Object.keys(this._events);
  }
}

// Export both named and default exports for compatibility
export { EventEmitter };
export default { EventEmitter };
