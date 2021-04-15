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
    game.accepted[color] = true
    games.y.set(game.name, JSON.stringify(game))
  }
  const reject = () => {
    game.accepted.white = false
    game.accepted.black = false
    games.y.set(game.name, JSON.stringify(game))
  }
</script>

<div class="actions">
  {#if !game.winner}
    {#if game.consecutivePasses == 2 }
      <h2>
        {#if !game.accepted.black && !game.accepted.white}
          Waiting for both players to accept the dead stones.
        {:else if game.accepted.black}
          Waiting for White to accept the dead stones.
        {:else if game.accepted.white}
          Waiting for Black to accept the dead stones.
        {/if}
      </h2>
      <button disabled={game.accepted[color]} on:click={accept}>Accept Dead Stones</button>
      <button disabled={!(game.accepted.black || game.accepted.white)} on:click={reject}>Reject Dead Stones</button>
    {:else}
      <button on:click={pass} disabled={!play}>Pass</button>
      <button on:click={resign} disabled={!play}>Resign</button>
    {/if}
  {/if}
</div>

<style>
  h2 {
    font-size: 1rem;
  }
</style>