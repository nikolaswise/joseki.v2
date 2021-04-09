<script>
  import ThemePicker from './components/ThemePicker.svelte'

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
<main>
  {#if $path == '/'}
    <Index games={dict}/>
  {:else if $path == '/new'}
    <New games={dict}/>
  {:else if $path == '/components'}
    <Components games={dict}/>
  {:else}
    <Slug games={dict}/>
  {/if}

  <footer>
    <ThemePicker />
    <p>Play Go online with friends, party time 🎉</p>
  </footer>
</main>

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
	main {
		padding: 1em;
		max-width: 1200px;
		margin: 0 auto;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
	}
  footer {
    text-align: center;
    margin-top: auto;
  }
</style>