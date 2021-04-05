import { writable } from 'svelte/store';
import readableMap from './ymap.js';

export const WebRTC = async () => {
  console.log('create connection')
  let Y = await import('yjs');
  let { WebrtcProvider } = await import('y-webrtc')

  const ydoc = new Y.Doc();
  const provider = new WebrtcProvider('joseki-party', ydoc)
  const ymap = ydoc.getMap('dict');
  let allData = readableMap(ymap)
  return readableMap(ymap)
}

export const RTCData = writable()