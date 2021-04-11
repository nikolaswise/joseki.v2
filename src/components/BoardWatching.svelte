<script>
  import Board from './Board.svelte'
  export let game
</script>

<div class="container">
  <h1>It is {game.turn}'s turn.</h1>
  <Board {game}/>
</div>

<style>
  h1 {
    padding-left: 1.5rem;
    font-size: var(--s-18);
  }
  .container {
    padding: 0 2rem 2rem 2rem;
    display: grid;
    max-width: calc(100vh - 14rem);
    margin: auto;
  }
</style>

