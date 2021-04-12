<script>
  // import { resign, pass } from './game-actions.js'

  export let game
  export let games
  export let color
  export let play

  const pass = () => {
    game.history.push([
      color == 'white' ? 'o' : 'x',
      null,
      null,
      true
    ])
    game.consecutivePasses += 1
    game.turn = game.turn == 'white' ? 'black' : 'white'
    games.y.set(game.name, JSON.stringify(game))
  }
  const resign = () => {
    game.winner = color == 'white' ? 'black' : 'white'
    game.resignation = true
    games.y.set(game.name, JSON.stringify(game))
  }
  const accept = () => {
    console.log('accept dead stones')
    game.accepted[color] = true
    games.y.set(game.name, JSON.stringify(game))
  }
</script>

<div class="actions">
  {#if !game.winner}
    {#if game.consecutivePasses == 2 }
      <button on:click={accept}>Accept Dead Stones</button>
    {:else}
      <button on:click={pass} disabled={!play}>Pass</button>
      <button on:click={resign} disabled={!play}>Resign</button>
    {/if}
  {/if}
</div>