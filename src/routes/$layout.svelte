<script>
  import { page } from '$app/stores';
  import HomeNav from '$lib/HomeNav.svelte'
  import Nav from '$lib/Nav.svelte'
	import '../app.css';
  $: {
    console.log($page)
  }
</script>

<div class="theme theme-default">
  <div class="content">
    {#if $page.path === '/'}
      <HomeNav />
    {:else}
      <Nav />
    {/if}
    <slot />
  </div>

  <footer>
    <p>Play Go online with friends, party time 🎉</p>
    {#if $page.path === '/'}
      <p>Built by <a href="https://nikolas.ws/">nikolas.ws</a></p>
    {/if}
  </footer>
</div>

<style>
  .theme {
    min-height: 100vh;
    box-sizing: border-box;
    display: grid;
    grid-template-rows: 1fr auto;
    padding-top: 1rem;
  }

  footer {
    text-align: center;
  }
</style>