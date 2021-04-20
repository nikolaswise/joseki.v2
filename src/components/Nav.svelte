<script>
  import Button from './Button.svelte'
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
      {color ? 'Playing' : 'Watching'} <code>{room}</code>
    {/if}
    <Button>
      ◐
    </Button>
  </div>

</nav>

<style>
  nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    max-width: 100%;
    padding-left: 2rem;
    padding-right: 2rem;
    margin: auto;
  }

  .actions {
    margin-bottom: 1rem;
  }

  a {
    color: var(--color-figure);
  }
</style>