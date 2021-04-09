<script>
  import Logo from './Logo.svelte'
  export let small
  export let stacked
</script>

<style>
  .lockup {
    display: inline-block;
    text-align: center;
    font-weight: 700;
  }
  .small {
    font-size: var(--s-12);
    display: flex;
  }
  .large {
    margin: 0;
    padding-top: 1rem;
    font-size: var(--s-36);
    line-height: 0.8;
  }
</style>

<div class="lockup">
  {#if stacked}
    <Logo />
  {/if}
  <p class={small ? 'small' : 'large'}>
    Joseki {#if stacked}<br>{/if}Party
  </p>
</div>
