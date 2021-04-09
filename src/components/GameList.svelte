<script>
  import { fade, fly } from 'svelte/transition';

  import Blob from './Blob.svelte'

  export let games = []
  export let title = undefined

</script>

<style>
  .list {
    text-align: left;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    border-bottom: 2px solid var(--color-figure);
  }

  .grid a {
    padding: var(--u-3p);
    padding-bottom: calc(var(--u-2p) + var(--u-3p));
    padding-left: calc(1rem + var(--u-6p));
    border-top: 2px solid var(--color-figure);
    color: var(--color-figure);
    background-color: transparent;
    transition: all 300ms ease-in-out;
    display: grid;
    grid-template-columns: auto 1fr 1fr 1fr;
    font-family: "Input";
  }
  .thead {
    display: grid;
    padding-left: 0;
    grid-template-columns: auto 1fr 1fr 1fr;
    font-weight: 700;
  }
  a:hover {
    text-decoration: none;
    background-color: var(--color-white);
    transition: all 300ms ease-in-out;
  }

  a .hover {
    display: none;
    width: 1rem;
    height: 1rem;
    position: absolute;
    transform: translate3d(-125%, var(--u-2p), 0);
  }
  a:hover .hover {
    display: inline-block
  }
  a .indicator {
    display: inline-block;
    position: absolute;
    transform: translate3d(-125%, var(--u-2p), 0);
    width: 1rem;
    height: 1rem;
  }
  a:hover .indicator {
    display: none;
  }

  .turn {
    padding-right: 1rem;
  }
  .komi,
  .size {
    text-align: right;
  }

</style>

<div
  class="list"
  in:fly="{{ y: 20, duration: 300 }}">
  {#if title}
    <h2>{title}</h2>
  {/if}
  {#if games.length}
    <div class="grid">
      <div class="thead">
        <span class="turn">Turn</span>
        <span class="name">Game Name</span>
        <span class="komi">Komi</span>
        <span class="size">Size</span>
      </div>
        {#each games as game}
          <a
            in:fly="{{ y: 20, duration: 300 }}"
            out:fly="{{ y: 20, duration: 300 }}"
            href="{game.name}">
            <span class="indicator">
              <Blob
                count={3}
                drift={30}
                deform={60}
                size="small"
                animate={true}
                color={game.turn}/>
            </span>
            <span class="hover">
              👀
            </span>
            <span class="turn">{game.history.length}: </span>
            <span class="name">{game.name.substring(1)}</span>
            <span class="komi">{game.komi}</span>
            <span class="size">{game.size}x{game.size}</span>
          </a>
        {/each}
    </div>
  {:else}
    <div class="grid">
      <div class="thead">
        <span class="turn">Turn</span>
        <span class="name">Game Name</span>
        <span class="komi">Komi</span>
        <span class="size">Size</span>
      </div>
    </div>
    <p>No games here yet!</p>
  {/if}
</div>