<script>
  import { createEventDispatcher } from 'svelte'
  import PointContent from './PointContent.svelte'

  export let size
  export let stone
  export let playable
  export let x
  export let y
  export let staged
  export let isMarkingDead
  export let isMarkedDead
  export let isStarPoint
  export let latestMove

  let isLatest = false

  $: {
    if (latestMove) {
      isLatest = x == latestMove[0] && y == latestMove[1]
    }
  }


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

  const markDead = () => {
    dispatch('markDead', {
      x: x,
      y: y
    });
  }
  const markAlive = () => {
    dispatch('markAlive', {
      x: x,
      y: y
    });
  }

  const latestMoveClass = (isLatest) =>`${isLatest ? 'latest-move' : ''}`
  const starPointClass = (isStarPoint) => `${isStarPoint ? 'star-point' : ''}`
</script>


<!-- If a moved is staged: -->
{#if $staged.length > 0}
  <!-- and this is the staged move -->
  {#if pointIsStaged(x, y)}
    <!-- click to play -->
    <button
      class={`${starPointClass(isStarPoint)}`}
      on:click={play(x,y)} >
      <PointContent {stone} {x} {y} {size} staged={true}/>
    </button>
  <!-- else -->
  {:else}
    <!-- click to unstage -->
    <button
      class={`${starPointClass(isStarPoint)}`}
      on:click={unstage(x,y)} >
      <PointContent {stone} {x} {y} {size}/>
    </button>
  {/if}
<!-- else -->
{:else}
  <!-- if picking dead stones -->
  {#if isMarkingDead }
    <!-- if stone is in the deadMap -->
    {#if isMarkedDead}
      <!-- click to mark alive stone -->
      <button
        class={`${starPointClass(isStarPoint)}`}
        on:click={markAlive} >
        <PointContent {stone} {x} {y} {size} {isMarkedDead}/>
      </button>
    <!-- else -->
    {:else}
      <!-- click to mark dead stone -->
      <button
        class={`${starPointClass(isStarPoint)}`}
        on:click={markDead} >
        <PointContent {stone} {x} {y} {size}/>
      </button>
    <!-- end -->
    {/if}
  <!-- else -->
  {:else}
    <!-- click to stage -->
    <button
      class={`${starPointClass(isStarPoint)} ${latestMoveClass(isLatest)} ${playable}`}
      on:click={stage(x,y)} >
      <PointContent {stone} {x} {y} {size}/>
    </button>
  {/if}
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
  .latest-move:after {
    content: '';
    background-color: var(--color-ground);
    display: block;
    height: 50%;
    position: absolute;
    z-index: 100;
    left: 50%;
    transform: translate3d(-50%, 0, 0);
    border-radius: 100%;
    width: 50%;
  }
  .star-point:after {
    content: '';
    background-color: var(--color-black);
    border-radius: 100%;
    width: 40%;
    height: 40%;
    position: absolute;
    left: 35%;
    z-index: 1;
  }
</style>