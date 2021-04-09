<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import HomeNav from '$lib/HomeNav.svelte'
  import Nav from '$lib/Nav.svelte'
  import { WebRTC, RTCData } from '$lib/WebRTC.js'
	import '../app.css';

  let data

  $: {
    if (data) {
      console.log(`I sync data: ${Date.now()}`)
      console.log($RTCData)
      console.log($data)
      // sync local data with upstream data
      $data.forEach((value, key) => {
        console.log(key)
        if (!$RTCData.get(key) === value) {
          $RTCData.set(key, value)
        }
      })
      // sync upstream data with local data
      $RTCData.forEach((value, key) => {
        console.log(key)
        if (!$data.get(key) === value) {
          data.y.set(key, value)
        }
      })
      console.log(`=>`)
      console.log($data)
    }
  }

  onMount(async () => {
    console.log('determine and set answer')
    data = await WebRTC()
    RTCData.set($data)
  })
</script>

<div class="theme theme-default">
  <div class="content">
    {#if $page.path === '/'}
      <HomeNav />
    {:else}
      <Nav />
    {/if}
    <slot/>
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