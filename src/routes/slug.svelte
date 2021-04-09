<script>
  import {path, player} from '../store.js';
  import Lockup from '../components/Lockup.svelte'
  import InviteModal from '../components/InviteModal.svelte'
  import Goban from '../components/goban.svelte'

  export let games

  let color
  let game
  let loading = true
  let invite

  $: {
    console.log($games)
    if ($games.size > 0) {
      game = JSON.parse($games.get($path))
      color = $player.get($path)
      invite = color == 'white' ? 'black' : 'white'
      loading = false

      if ( window.location.search == '?black' || window.location.search == '?white' ){
        game.players = 2

        if (window.location.search == '?black') {
          color = 'black'
        }
        if (window.location.search == '?white') {
          color = 'white'
        }

        player.update(p => p.set(game.name, color))
        let playerData = JSON.stringify([...$player.entries()])
        localStorage.setItem('joseki-party', playerData)

        games.y.set(game.name, JSON.stringify(game))
      }
    }
  }

  const play = (event) => {
    game.history.push([
      event.detail.player,
      event.detail.x,
      event.detail.y
    ])
    game.consecutivePasses = 0
    game.turn = game.turn == 'white' ? 'black' : 'white'
    games.y.set(game.name, JSON.stringify(game))
  }

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

  const gameOver = (event) => {
    let score = Math.abs(event.detail)
    let winner = event.detail > 0 ? 'black' : 'white'
    game.winner = winner
    game.score = score
    games.y.set(game.name, JSON.stringify(game))
  }

  const markDead = (event) => {
    let x = event.detail.x
    let y = event.detail.y
    let deadMap = new Map(game.deadStones)
    deadMap.set(`${x}${y}`, [x,y])
    game.deadStones = [...deadMap]
    games.y.set(game.name, JSON.stringify(game))
  }

  const markAlive = (event) => {
    let deadMap = new Map(game.deadStones)
    deadMap.delete(`${event.detail.x}${event.detail.y}`)
    game.deadStones = [...deadMap]
    games.y.set(game.name, JSON.stringify(game))
  }

  const accept = () => {
    game.accepted[color] = true
    games.y.set(game.name, JSON.stringify(game))
  }

  const reject = () => {
    game.accepted[color] = false
    games.y.set(game.name, JSON.stringify(game))
  }

</script>

<style>
  header {
    display: flex;
    justify-content: space-between;
  }
  h1 {
    font-size: var(--s-12);
  }
  .container {
    display: flex;
    flex-wrap: wrap;
  }
  .meta {
    flex-grow: 2;
    flex-basis: 200px;
  }
  .board {
    flex-basis: 750px;
    flex-grow: 1;
  }
</style>

<header>
  <Lockup stacked={false} small={true}/>
  {#if loading} … {:else} <h1>Playing <code>{game.name.substring(1)}</code></h1> {/if}
</header>

<div class="container">
  {#if loading}
    <div class="meta">
      <p>…</p>
    </div>
  {:else if typeof color != 'undefined'}
    <div class="meta">
      {#if game.players == 1}
        <InviteModal {invite} />
      {/if}

      <h3>You are {color}</h3>

      {#if game.consecutivePasses == 2 && !game.winner }
        <h3>Remove Dead Stones</h3>
      {:else if !game.winner }
        <h3>It is {game.turn}'s turn</h3>
      {:else}
        <h3>{game.winner} wins by {game.resignation ? 'resignation' : `${game.score} point${game.score > 1 ? 's' : '' }.` }</h3>
      {/if}

      {#if game.consecutivePasses < 2 }
        <div>
          {#if color == game.turn && !game.winner}
            <button on:click={pass}>Pass</button>
            <button on:click={resign}>Resign</button>
          {:else}
            <button disabled>Pass</button>
            <button disabled>Resign</button>
          {/if}
        </div>
      {:else}
        <div>
          {#if !game.accepted[color]}
            <button on:click={accept}>Accept Stones</button>
          {:else}
            <button on:click={reject}>Reject Stones</button>
          {/if}
        </div>
      {/if}
    </div>
  {:else}
    <div class="meta">
      <h2>Watching {game.name}</h2>
      {#if !game.winner }
        <h3>It is {game.turn}'s turn</h3>
      {:else}
        <h3>{game.winner} wins by {game.resignation ? 'resignation' : `${game.score} point${game.score > 1 ? 's' : '' }.` }</h3>
      {/if}
    </div>
  {/if}

  <div class="board">
    {#if !loading}
      <Goban
        {game}
        {color}
        size={game.size}
        on:markDead={markDead}
        on:markAlive={markAlive}
        on:pass={pass}
        on:gameOver={gameOver}
        on:resign={resign}
        on:move={play} />
    {/if}
  </div>
</div>