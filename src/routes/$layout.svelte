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
  </footer>
</div>

<style>
  .theme {
    min-height: 100vh;
    display: grid;
    grid-template-rows: 1fr auto;
  }

  footer {
    text-align: center;
  }
</style>