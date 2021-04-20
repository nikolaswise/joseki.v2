<script>
  import Weiqi from 'weiqi'
  import { writable } from 'svelte/store';

  import Point from './Point.svelte'
  import Replayer from './Replayer.svelte'
  import { submitMove, markDead, markAlive, endGame } from './game-actions.js'
  import StarPoints from './star-points.js'

  export let game
  export let games
  export let color
  export let play

  let board
  let boardArr
  let starPoints

  let viewMove = null
  let rewatching = false
  let latestMove = null

  const staged = writable([])

  let deadMap

  let playStone = () => {}
  let markDeadStone = () => {}
  let markAliveStone = () => {}

  let isStarPoint = (point, StarPoints) => starPoints
    .map(point => point.toString())
    .includes(point.toString())

  $: {
    board = Weiqi.createGame(game.size)

    game.history.some(([player, x, y, pass], i) => {
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

    if (game.accepted.white && game.accepted.black && !game.winner) {
      game.deadStones.forEach(stone => {
        board.removeStone([stone[1][0], stone[1][1]])
      })
      let score = board.areaScore(game.komi)
      endGame(game, games)(score)
    }

    deadMap = new Map(game.deadStones)

    playStone = submitMove(game, games, board.getCurrentPlayer())
    markDeadStone = markDead(game, games)
    markAliveStone = markAlive(game, games)
    boardArr = board.getBoard().toArray()
    starPoints = StarPoints.get(game.size.toString())
  }
</script>

<div class="grid grid-{game.size}">
  {#each boardArr as row, x}
    {#each row as stone, y}
      <Point
        on:play={playStone}
        on:markDead={markDeadStone}
        on:markAlive={markAliveStone}
        playable={play}
        isMarkedDead={deadMap.get(`${x}${y}`)}
        isMarkingDead={game.consecutivePasses == 2 && !game.winner}
        isStarPoint={isStarPoint([x,y], starPoints)}
        {stone}
        {x} {y}
        {staged}
        {latestMove}
        size={game.size}
      />
    {/each}
  {/each}
</div>

<Replayer
  {game}
  bind:viewMove
  bind:rewatching
/>

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