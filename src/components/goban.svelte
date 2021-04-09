<script>
  import Weiqi from 'weiqi'
  import { writable } from 'svelte/store';
  import { createEventDispatcher } from 'svelte';

  export let game
  export let size
  export let color

  const dispatch = createEventDispatcher();

  let board
  let boardArr

  let viewMove = null
  let rewatching = false

  let cleaning = false
  let deadMap = new Map()

  let latestMove = null

  const staged = writable([])

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
    if (!game.winner && game.consecutivePasses > 1) {
      cleaning = true
    }
    if (game.accepted.white && game.accepted.black && !game.winner) {
      game.deadStones.forEach(stone => {
        board.removeStone([stone[1][0], stone[1][1]])
      })
      let score = board.areaScore(game.komi)
      dispatch('gameOver', score)
    }

    deadMap = new Map(game.deadStones)
    boardArr = board.getBoard().toArray()
  }

  const play = (x,y) => () => {
    staged.set([])
    dispatch('move', {
      player: board.getCurrentPlayer(),
      x: x,
      y: y
    });
  }

  const stage = (x,y) => () => {
    staged.set([x,y])
  }

  const unstage = () => {
    staged.set([])
  }

  const markDead = (x,y) => () => {
    dispatch('markDead', {
      x: x,
      y: y
    });
  }

  const markAlive = (x,y) => () => {
    dispatch('markAlive', {
      x: x,
      y: y
    });
  }

  const firstMove = () => {
    rewatching = true
    cleaning = false
    viewMove = 1
  }

  const previousMove = () => {
    rewatching = true
    cleaning = false
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
      cleaning = false
    }
  }

  const lastMove = () => {
    rewatching = false
    cleaning = false
    viewMove = null
  }

</script>

<h3>Board {rewatching ? `: Replaying move ${viewMove}` : ''}</h3>

<div class="grid grid-{size}">
  {#if !rewatching && !cleaning}
    {#each boardArr as row, x}
      {#each row as col, y}
        {#if col == '.'}
          {#if color == game.turn}
            {#if $staged.length > 0}
              {#if x == $staged[0] && y == $staged[1]}
                <button on:click={play(x,y)}>
                  <hr class={y === 0 ? 'x f' : y === (size - 1) ? 'x l' : 'x'}>
                  <hr class={x === 0 ? 'y t' : x === (size - 1) ? 'y b' : 'y'}>
                  <span>?</span>
                </button>
              {:else}
                <button on:click={unstage}>
                  <hr class={y === 0 ? 'x f' : y === (size - 1) ? 'x l' : 'x'}>
                  <hr class={x === 0 ? 'y t' : x === (size - 1) ? 'y b' : 'y'}>
                </button>
              {/if}
            {:else}
              <button on:click={stage(x,y)}>
                <hr class={y === 0 ? 'x f' : y === (size - 1) ? 'x l' : 'x'}>
                <hr class={x === 0 ? 'y t' : x === (size - 1) ? 'y b' : 'y'}>
              </button>
            {/if}
          {:else}
            <button disabled>
              <hr class={y === 0 ? 'x f' : y === (size - 1) ? 'x l' : 'x'}>
              <hr class={x === 0 ? 'y t' : x === (size - 1) ? 'y b' : 'y'}>
            </button>
          {/if}
        {:else}
          <button
            class={x == latestMove[0] && y == latestMove[1] ? 'last-move' : ''}
            disabled>
            <hr class={y === 0 ? 'x f' : y === (size - 1) ? 'x l' : 'x'}>
            <hr class={x === 0 ? 'y t' : x === (size - 1) ? 'y b' : 'y'}>
            <span>{col == 'x' ? '⚫' : '⚪'}</span>
          </button>
        {/if}
      {/each}
    {/each}
  {:else if cleaning}
    {#each boardArr as row, x}
      {#each row as col, y}
        {#if col == '.'}
          <button disabled>
            <hr class={y === 0 ? 'x f' : y === (size - 1) ? 'x l' : 'x'}>
            <hr class={x === 0 ? 'y t' : x === (size - 1) ? 'y b' : 'y'}>
          </button>
        {:else}
          {#if deadMap.get(`${x}${y}`)}
            <button on:click={markAlive(x,y)}>
              <hr class={y === 0 ? 'x f' : y === (size - 1) ? 'x l' : 'x'}>
              <hr class={x === 0 ? 'y t' : x === (size - 1) ? 'y b' : 'y'}>
              ☠️
            </button>
          {:else}
            <button on:click={markDead(x,y)}>
              <hr class={y === 0 ? 'x f' : y === (size - 1) ? 'x l' : 'x'}>
              <hr class={x === 0 ? 'y t' : x === (size - 1) ? 'y b' : 'y'}>
              <span>
                {#if col == 'x'}
                  ⚫
                {:else}
                  ⚪
                {/if}
              </span>
            </button>
          {/if}
        {/if}
      {/each}
    {/each}
  {:else}
    <!-- replay board -->
    {#each boardArr as row, x}
      {#each row as col, y}
          <!-- this needs a latest move indicator -->
          <!-- if x,y ==  game.history.[watchMove],
               is latest move-->
          <button
            class={x == latestMove[0] && y == latestMove[1] ? 'last-move' : ''}
            disabled>
            {#if col == 'x'}
              ⚫
            {:else if col == 'o'}
              ⚪
            {:else}

            {/if}
          </button>
      {/each}
    {/each}
  {/if}
</div>

<div class="{viewMove ? '' : 'disabled'}">
  <h3>
    <!-- <button on:click={firstMove}>⏪</button>
    <button on:click={previousMove}>⬅️</button> -->
      Turn
      <input
        type="number"
        min=0
        max={game.history.length}
        value={rewatching ? viewMove : game.history.length}/>
    <!-- <button on:click={nextMove}>➡️</button> -->
    <!-- <button on:click={lastMove}>⏩</button> -->
  </h3>
</div>

<style>
  button {
    margin: 0;
    border: 1px solid black;
    background-color: transparent;
    padding: 0;
    display: grid;
    align-items: center;
    cursor: pointer;
    position: relative;
    border: none;
    font-size: 2em;
  }
  button:before {
    content: '';
    display: block;
    height: 0;
    padding-bottom: 100%;
  }
  span {
    position: absolute;
    top: 0;
    display: grid;
    height: 100%;
    width: 100%;
    justify-content: center;
    align-content: center;
  }
  hr {
    position: absolute;
    border: none;
    outline: none;
    display: block;
    margin: 0;
  }
  hr.x {
    left: 0;
    right: 0;
    top: 50%;
    border-top: 2px solid black;
  }
  hr.x.f {
    left: 50%;
  }
  hr.x.l {
    right: 50%;
  }
  hr.y {
    left: 50%;
    border-left: 2px solid black;
    height: 100%;
  }
  hr.y.t {
    height: 50%;
    top: 50%;
  }
  hr.y.b {
    height: 50%;
    top: 0%;
  }
  .grid {
    display: grid;
    height: 0;
    padding-bottom: 100%;
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

  .disabled {
    pointer-events: none;
    opacity: 0.2;
  }

  .last-move {
    border: 1px solid pink
  }
</style>