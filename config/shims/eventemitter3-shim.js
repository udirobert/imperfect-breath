// This is a shim file to fix the eventemitter3 import issue in @wagmi/core
// Simple EventEmitter implementation to replace the problematic module

class EventEmitter {
  constructor() {
    this._events = {};
  }

  on(event, listener) {
    if (!this._events[event]) {
      this._events[event] = [];
    }
    this._events[event].push(listener);
    return this;
  }

  off(event, listener) {
    if (!this._events[event]) return this;
    this._events[event] = this._events[event].filter((l) => l !== listener);
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
}

// Export both formats required by different modules
export { EventEmitter };
export default EventEmitter;
