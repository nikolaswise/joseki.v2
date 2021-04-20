<script>
import Button from '../components/Button.svelte'
import GameList from '../components/GameList.svelte'

import {player} from '../store.js';
  export let games

  let watchableGames
  let userGames
  let userTurnGames
  let userWaitingGames

  $: {
    if ($games.size > 0) {
      let gamesData = [...$games.values()].map(JSON.parse)
      let playerData = [...$player.keys ()]
      userGames = gamesData.filter(game => $player.get(game.name))
      userTurnGames = userGames.filter(game => game.turn == $player.get(game.name))
      userWaitingGames = userGames.filter(game => game.turn != $player.get(game.name))
      watchableGames = gamesData.filter(game => !$player.get(game.name))
    }
  }

</script>

<main>
  <header>
    <h1>Games</h1>
    <Button href="/new">New Game</Button>
  </header>

  {#if userTurnGames || userWaitingGames}
    {#if userTurnGames.length + userWaitingGames.length > 0 }
      {#if userGames}
        <GameList
          title="Your Turn"
          games={userTurnGames}/>

        <GameList
          title="Their Turn"
          games={userWaitingGames}/>
      {/if}
    {/if}
  {:else}

  {/if}

  {#if watchableGames}
    <GameList
      title="Watch Games"
      games={watchableGames}/>
  {/if}
</main>

<style>
  main {
    max-width: max-content;
    margin: auto;
  }
  header {
    display: flex;
    justify-items: space-between;
    align-items: center;
    justify-content: space-between;
  }
</style>