<script>
  export let game
  export let rewatching
  export let viewMove

  const firstMove = () => {
    rewatching = true
    viewMove = 1
  }

  const previousMove = () => {
    rewatching = true
    if (viewMove == 1) {
      return
    }
    viewMove = viewMove - 1
  }
  const nextMove = () => {
    if (viewMove + 1 > game.history.length) {
      return
    }
    if (viewMove + 1 == game.history.length) {
      viewMove = null
      rewatching = false
    } else {
      viewMove += 1
      rewatching = true
    }
  }

  const lastMove = () => {
    rewatching = false
    viewMove = null
  }
</script>

<div class="{viewMove ? 'replay' : 'replay disabled'}">
  <h3>
    <button on:click={firstMove}>⏪</button>
    <button on:click={previousMove}>⬅️</button>
      Turn
      <input
        type="number"
        min=0
        max={game.history.length}
        value={rewatching ? viewMove : game.history.length}/>
    <button on:click={nextMove}>➡️</button>
    <button on:click={lastMove}>⏩</button>
  </h3>
</div>

<style>
  .replay {
    text-align: center;
  }
</style>