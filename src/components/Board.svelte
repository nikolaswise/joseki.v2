<script>
  import Weiqi from 'weiqi'
  import { writable } from 'svelte/store';

  import Point from './Point.svelte'
  import { submitMove } from './game-actions.js'

  export let game
  export let games
  export let color
  export let play

  let board
  let boardArr

  let viewMove = null
  let rewatching = false
  let latestMove = null

  const staged = writable([])

  let playStone = () => {}

  $: {
    board = Weiqi.createGame(game.size)

    game.history.some(([player, x, y, pass], i) => {
      console.log('recreate game from move')
      console.log(player, x, y, pass)
      if (pass) {
        board = board.pass(player)
        latestMove = []
      } else {
        board = board.play(player, [x, y])
        latestMove = [x, y]
      }
      return rewatching && viewMove - 1 == i
    })

    if (!rewatching) {
      viewMove = game.history.length
    }

    playStone = submitMove(game, games, board.getCurrentPlayer())
    boardArr = board.getBoard().toArray()
  }
</script>

<div class="grid grid-{game.size}">
  {#each boardArr as row, x}
    {#each row as stone, y}
      <Point
        on:play={playStone}
        playable={play}
        {stone}
        {x} {y}
        {staged}
        size={game.size}
      />
    {/each}
  {/each}
</div>

<style>
  .grid {
    display: grid;
    height: 0;
    padding-bottom: 100%;
    max-width: calc(100vh - 4rem);
  }
  .grid-9 {
    grid-template-columns: repeat(9, 1fr);
  }
  .grid-13 {
    grid-template-columns: repeat(13, 1fr);
  }
  .grid-19 {
    grid-template-columns: repeat(19, 1fr);
  }

  /*button shit*/

</style>