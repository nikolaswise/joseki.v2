<script>
  import ThemePicker from './ThemePicker.svelte'
  import Lockup from './Lockup.svelte'
  import { path, player } from '../store.js';


  let color
  $: color = $player.get($path)

  export let room
</script>

<nav>
  <a href="/">
    <Lockup stacked={false} small={true}/>
  </a>
  <div class="actions">
    {#if room}
      <span>{color ? 'Playing' : 'Watching'} <code>{room}</code></span>
    {/if}
    <ThemePicker />
  </div>

</nav>

<style>
  nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    max-width: 100%;
    margin: auto;
  }

  .actions {
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
  }
  span {
    margin-right: 1rem;
  }
  a {
    color: var(--color-figure);
  }
</style>