<script>
  import HomeNav from './components/HomeNav.svelte'
  import Nav from './components/Nav.svelte'

  import * as Y from 'yjs';
  import { WebsocketProvider } from 'y-websocket';
  import { WebrtcProvider } from 'y-webrtc'

  import { map } from 'svelt-yjs';

  import Index from './routes/index.svelte'
  import New from './routes/new.svelte'
  import Slug from './routes/slug.svelte'
  import Components from './routes/components.svelte'
  import { path, player } from './store.js';
  import { setLocalPlayerData } from './components/player-data'
  export let name;

  const ydoc = new Y.Doc();
  const provider = new WebrtcProvider('joseki-party-v2', ydoc)
  const ymap = ydoc.getMap('dict');
  const dict = map.readable(ymap);

  let color

  $: {
    console.log('whats in here?')
    console.log($player)
    console.log($dict.size)
    let playerData = JSON.stringify([...$player.entries()])
    console.log('set local player data in')
    console.log(playerData)
    localStorage.setItem('joseki-player', playerData)
  }
</script>

<div class="theme">
  <div class="content">
    {#if $path == '/'}
      {#if $dict.size > 0}
        <Nav />
        <Index games={dict}/>
      {:else}
        <HomeNav />
      {/if}
    {:else if $path == '/new'}
      <Nav />
      <New games={dict}/>
    {:else}
      <Nav room={$path.substring(1)}/>
      <Slug games={dict}/>
    {/if}
  </div>

  <footer>
    <p>Play Go online with friends, party time 🎉</p>
    {#if $path === '/'}
      <p>Built by <a href="https://nikolas.ws/">nikolas.ws</a></p>
    {/if}
  </footer>
</div>

<svg
  class="defs"
  xmlns="http://www.w3.org/2000/svg" version="1.1">
  <defs>
<!--     <filter id="goo" width="102400" height="102400">
      <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
      <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -7" result="goo" />
      <feComposite in="SourceGraphic" in2="goo" operator="mix"/>
    </filter> -->
    <filter id="goo" color-interpolation-filters="sRGB">
      <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
      <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 21 -7" result="cm" />
    </filter>
  </defs>
</svg>

<style>
  .defs {
    height: 0;
  }
  .theme {
    min-height: 98vh;
    box-sizing: border-box;
    display: grid;
    grid-template-rows: 1fr auto;
    padding-top: 1rem;
  }
  .content {
    max-width: 100vw;
    box-sizing: border-box;
    padding-left: 2rem;
    padding-right: 2rem;
  }
  footer {
    text-align: center;
  }
</style>