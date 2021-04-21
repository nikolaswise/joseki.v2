import { writable } from 'svelte/store';

export const path = writable(window.location.pathname)

export let player = writable(
  new Map(JSON.parse(localStorage.getItem('joseki-player')))
  || new Map()
);
