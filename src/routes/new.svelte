<script>
  import { onMount } from 'svelte';
  import { RTCData } from '$lib/WebRTC.js'


  import { goto } from '$app/navigation';
  import generateName from '$lib/game-names.js'
  import Button from '$lib/Button.svelte'

  let name = generateName()
  let komi = 0.5
  let size = 19
  let color = 'white'

  $: {
    console.log('retreive answer')
    console.log($RTCData)
  }

  const createGame = (e) => {
    e.preventDefault()
    console.log('new game!')
    goto(`/${name}`)
  }
</script>

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

<style>
  form {
    max-width: max-content;
    margin: auto;
    border-top: 2px solid var(--color-figure);
  }
  label {
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