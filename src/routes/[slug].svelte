<script>
  import Goban from '$lib/Goban.svelte'
  import { RTCData } from '$lib/WebRTC.js'

  $: {
    console.log('retreive answer')
    console.log($RTCData)
  }
</script>

<div class="container">
  <div class="meta">
    <h2>A Game</h2>
  </div>
  <div class="board">
    <Goban />
  </div>
</div>

<style>
  .container {
    display: flex;
    flex-wrap: wrap;
  }
  .meta {
    flex-grow: 2;
    flex-basis: 200px;
    padding-left: 2rem;
    padding-right: 2rem;
  }
  .board {
    flex-basis: 750px;
    flex-grow: 1;
  }
</style>