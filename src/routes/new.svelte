<script>
  import Lockup from '../components/Lockup.svelte'
  import Button from '../components/Button.svelte'

  import {path, player} from '../store.js';
  import generateName from '../components/game-names'

  export let games

  let name = generateName()
  let komi = 0.5
  let size = 19
  let color = 'white'

  const createGame = (e) => {
    e.preventDefault()

    let gameData = {
      name: `/${name}`,
      komi: komi,
      size: size,
      turn: 'black',
      winner: null,
      resignation: false,
      score: null,
      consecutivePasses: 0,
      players: 1,
      accepted: {
        black: false,
        white: false,
      },
      history: [],
      deadStones: [],
    }

    games.y.set(gameData.name, JSON.stringify(gameData))

    player.update(p => p.set(gameData.name, color))
    let playerData = JSON.stringify([...$player.entries()])
    localStorage.setItem('joseki-party', playerData)

    window.history.pushState({}, '', name);
    path.set(gameData.name)

    console.log($games)
  }

</script>

<style>
  form {
    border-top: 2px solid var(--color-figure);
  }
  label {
    /*padding: var(--u-3p);*/
    padding: calc(var(--u-2p) + var(--u-3p)) 0;
    border-bottom: 2px solid var(--color-figure);
    display: grid;
    grid-template-columns: 1fr 1fr;
    font-family: "Input";
    align-items: center;
  }
  input,
  select {
    margin-bottom: 0;
  }

  .submit {
    text-align: right;
    margin-top: 1rem;
  }
</style>

<h2>New Game</h2>
<form
  on:submit={createGame}>
  <label>
    Room
    <input type="text" bind:value={name}  >
  </label>

  <label>
    Komi
    <select bind:value={komi}>
      <option value=0>
        No Komi
      </option>
      <option value=0.5>
        1/2
      </option>
    </select>
  </label>

<label>
    Size
    <select bind:value={size}>
      <option value="9">
        9x9
      </option>
      <option value="13">
        13x13
      </option>
      <option selected value="19">
        19x19
      </option>
    </select>
  </label>

  <label>
    Color
    <select bind:value={color}>
      <option value="white">
        White
      </option>
      <option value="black">
        Black
      </option>
    </select>
  </label>

  <div class="submit">
    <Button
      large={true}>
      Create Game
    </Button>
  </div>
</form>
