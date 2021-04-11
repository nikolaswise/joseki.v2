<script>
  import Board from './Board.svelte'
  import Invite from './Invite.svelte'

  export let game
  export let games
  export let invite
  export let color

  let play = false

  $: play = game.turn == color
</script>

<div class="container">
  <div class="meta">
    <h1>
      {#if game.players == 1}
        Waiting for an opponent to join.
      {:else if play}
        It's your turn.
      {:else if !play }
        Waiting for your opponent to play.
      {:else}
        …
      {/if}
    </h1>

    {#if game.players == 1}
      <Invite {invite} />
      <p>
        Waiting for another player to joing. Once they do, the game will begin.
      </p>
    {/if}

  </div>

  <div class="board">
    <Board {game} {games} {color} {play}/>
  </div>
</div>

<style>
  .container {
    display: flex;
    flex-wrap: wrap;
    padding: 0 2rem 2rem 2rem;
  }
  .meta {
    flex-grow: 1;
    flex-basis: 200px;
    padding-right: 1rem;
  }
  .board {
    flex-basis: 750px;
    flex-grow: 1;
  }
  h1 {
    font-size: var(--s-14);
  }
  p {
    margin-top: 0;
  }
</style>