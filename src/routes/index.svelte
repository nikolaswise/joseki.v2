<script>
  import Lockup from '../components/Lockup.svelte'
  import Button from '../components/Button.svelte'
  import GameList from '../components/GameList.svelte'

  import generateName from '../components/game-names'
  import {player} from '../store.js';

  export let games
  const newGame = () => {
    games.y.set(generateName(), 'cool-new-game')
  }

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
      console.log(watchableGames)
    }
  }
</script>

<style>
  header {
    text-align: center;
  }
  .padded {
    margin-top: 5rem;
  }

  p {
    text-align: center;
    margin-top: 2rem;
  }
  .small {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
</style>

{#if $games.size > 0}
  <header class="small">
    <Lockup stacked={false} small={true}/>

    <Button
      href="/new">
      New Game
    </Button>

  </header>

{:else}
  <header class="padded">
    <Lockup stacked={true}/>
  </header>

  <p>
    <Button
      large={true}
      href="/new">
      New Game
    </Button>
  </p>
{/if}


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

