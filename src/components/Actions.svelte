<script>
  // import { resign, pass } from './game-actions.js'

  export let game
  export let games
  export let color
  export let play

  // submitMove(game, games, board.getCurrentPlayer())
  let Player = color == 'white' ? 'o' : 'x'

  const pass = () => {
    console.log('pass!')
  }
  const resign = () => {
    console.log('resign!')
  }
</script>

<div class="actions">
  <button on:click={pass} disabled={!play}>Pass</button>
  <button on:click={resign} disabled={!play}>Resign</button>
</div>