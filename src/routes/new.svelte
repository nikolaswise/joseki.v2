<script>
  import Lockup from '../components/Lockup.svelte'
  import Button from '../components/Button.svelte'

  import {path, player} from '../store.js';
  import generateName from '../components/game-names'
  import { newGame } from '../components/new-game'
  import goTo from '../components/goto'

  export let games

  let name = generateName()
  let komi = 0.5
  let size = 19
  let color = 'white'

  const createGame = (e) => {
    e.preventDefault()
    let uri = newGame(games, player)({name, komi, size, color})
    goTo(name)
  }

</script>

<div class="container">
  <form
    on:submit={createGame}>
    <h2>New Game</h2>
    <label>
      Room
      <input type="text" bind:value={name}  >
    </label>

    <label>
      Komi
      <select bind:value={komi}>
        <option value=0.5>
          1/2
        </option>
        <option value=1.5>
          1 1/2
        </option>
        <option value=2.5>
          2 1/2
        </option>
        <option value=3.5>
          3 1/2
        </option>
        <option value=4.5>
          4 1/2
        </option>
        <option value=5.5>
          5 1/2
        </option>
        <option value=6.5>
          6 1/2
        </option>
        <option value=7.5>
          7 1/2
        </option>
        <option value=8.5>
          8 1/2
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
</div>

<style>
  .container {
    display: grid;
    align-items: center;
    height: 66%;
    max-width: 100%;
    box-sizing: border-box;
  }

  form {
    border: 2px solid var(--color-figure);
    padding: 1rem 2rem;
    max-width: 100%;
    margin: auto;
  }

  label {
    padding: calc(var(--u-2p) + var(--u-3p)) 0;
    border-top: 2px solid var(--color-figure);
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