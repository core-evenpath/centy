// src/firebase/error-emitter.ts
import { EventEmitter } from 'events';

// Use a global symbol to ensure a single instance of the emitter
const EMITTER_SYMBOL = Symbol.for('firebase-error-emitter');

function getGlobalEmitter(): EventEmitter {
  const globalWithEmitter = global as typeof global & { [EMITTER_SYMBOL]?: EventEmitter };
  
  if (!globalWithEmitter[EMITTER_SYMBOL]) {
    globalWithEmitter[EMITTER_SYMBOL] = new EventEmitter();
  }
  
  return globalWithEmitter[EMITTER_SYMBOL]!;
}

export const errorEmitter = getGlobalEmitter();
