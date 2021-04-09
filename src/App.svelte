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
  import { path } from './store.js';
  export let name;

  const ydoc = new Y.Doc();
  const provider = new WebrtcProvider('joseki-party', ydoc)
  const ymap = ydoc.getMap('dict');
  const dict = map.readable(ymap);
</script>

<div class="theme theme-default">
  <div class="content">
    {#if $path == '/'}
      <HomeNav />
      <Index games={dict}/>
    {:else if $path == '/new'}
      <Nav />
      <New games={dict}/>
    {:else}
      <Nav />
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
    <filter id="goo">
      <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
      <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -7" result="goo" />
      <feComposite in="SourceGraphic" in2="goo" operator="mix"/>
    </filter>
  </defs>
</svg>

<style>
  .defs {
    height: 0;
  }

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