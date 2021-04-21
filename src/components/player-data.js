import { get } from 'svelte/store';
import { player } from '../store.js';

export const setLocalPlayerData = playerData => {
  localStorage.setItem('joseki-party-v2', playerData)
}

// Takes a store update function.
export const updatePlayerData = (fn) => {
  player.update(fn)
  let playerData = JSON.stringify([...get(player).entries()])
  setLocalPlayerData(playerData)
}