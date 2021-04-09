import { writable } from 'svelte/store';
// import readableMap from './ymap.js';

export const WebRTC = async () => {
  console.log('create connection')
  let Y = await import('yjs');
  let { WebrtcProvider } = await import('y-webrtc')
  let { readableMap } = await import('svelt-yjs');

  console.log(readableMap)

  const ydoc = new Y.Doc();
  const provider = new WebrtcProvider('joseki-party', ydoc)
  const ymap = ydoc.getMap('dict');
  const dict = readableMap(ymap);
  // let allData = readableMap(ymap)
  console.log(dict)
  return dict
}

export const RTCData = writable()