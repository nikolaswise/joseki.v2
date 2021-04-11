<script>
  import { createEventDispatcher } from 'svelte';
  import PointContent from './PointContent.svelte'

  export let size
  export let stone
  export let playable
  export let x
  export let y
  export let staged

  const dispatch = createEventDispatcher();

  const pointIsStaged = (x, y) => x == $staged[0] && y == $staged[1]

  const play = (x,y) => () => {
    staged.set([])
    dispatch('play', {
      x: x,
      y: y
    });
  }

  const stage = (x,y) => () => {
    staged.set([x,y])
  }

  const unstage = () => {
    staged.set([])
  }
</script>


<!-- If a moved is staged: -->
{#if $staged.length > 0}
  <!-- and this is the staged move -->
  {#if pointIsStaged(x, y)}
    <!-- click to play -->
    <button
      on:click={play(x,y)} >
      <PointContent {stone} {x} {y} {size} staged={true}/>
    </button>
  <!-- else -->
  {:else}
    <!-- click to unstage -->
    <button
      on:click={unstage(x,y)} >
      <PointContent {stone} {x} {y} {size}/>
    </button>
  {/if}
<!-- else -->
{:else}
  <!-- click to stage -->
  <button
    on:click={stage(x,y)}
    class={playable} >
    <PointContent {stone} {x} {y} {size}/>
  </button>
<!-- end -->
{/if}

<style>
  button {
    margin: 0;
    border: 1px solid black;
    background-color: transparent;
    padding: 0;
    display: grid;
    align-items: center;
    cursor: pointer;
    position: relative;
    border: none;
    font-size: 2em;
  }
  button.false {
    cursor: initial;
    pointer-events:none
  }
  button:before {
    content: '';
    display: block;
    height: 0;
    padding-bottom: 100%;
  }
</style>