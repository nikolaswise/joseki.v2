<script>
  import Blob from './Blob.svelte'
  import Board from './Board.svelte'
  import Invite from './Invite.svelte'
  import Actions from './Actions.svelte'

  export let game
  export let games
  export let invite
  export let color

  let play = false
  let other = color == 'white' ? 'black' : 'white'
  $: play = game.turn == color
</script>

<div class="container">
  <div class="meta">
    {#if game.players == 1}
      <div class="indicator">
        <Blob animate={true} color={color} size='large' />
        <Blob animate={true} color={other} size='large' />
      </div>
      <h1>Waiting for an opponent to join.</h1>
    {:else if play}
      <div class="indicator">
        <Blob animate={play} color={color} size='large' />
        <Blob animate={!play} color={other} size='large' />
      </div>
      <h1>It's your turn.</h1>
    {:else if !play }
      <div class="indicator">
        <Blob animate={play} color={color} size='large' />
        <Blob animate={!play} color={other} size='large' />
      </div>
      <h1>Waiting for your opponent to play.</h1>
    {:else}
      <h1>Loading …</h1>
    {/if}

    {#if game.players == 1}
      <Invite {invite} />
      <p>
        Waiting for another player to joing. Once they do, the game will begin.
      </p>
    {:else}
      <Actions {game} {games} {color}/>
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
    padding-top: 2rem;
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