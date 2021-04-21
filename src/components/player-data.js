import { get } from 'svelte/store';
import { player } from '../store.js';

export const setLocalPlayerData = playerData => {
  console.log('set local player data')
  console.log(playerData)
  localStorage.setItem('joseki-player', playerData)
}

// Takes a store update function.
export const updatePlayerData = (fn) => {
  player.update(fn)
  let playerData = JSON.stringify([...get(player).entries()])
  console.log(playerData)
  setLocalPlayerData(playerData)
}