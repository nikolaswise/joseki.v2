<script>
  export let href = false
  export let small = false
  export let medium = true
  export let large = false
</script>

<style>
  a,
  button {
    width: max-content;
    display: inline-block;
    color: var(--color-ground);
    background-color: var(--color-figure);
    padding: calc(var(--u-1p) + var(--u-6p)) calc(var(--u-3p) + var(--u-6p));
    border: 1px solid var(--color-ground);
    text-decoration: none;
    border-radius: 1rem;
    transform: translate3d(0,0,0);
    box-shadow: rgba(17, 17, 26, 0.1) 0px 4px 16px, rgba(17, 17, 26, 0.05) 0px 8px 32px;
    transition: all 200ms ease-in-out;
    position: relative;
    cursor: pointer;
  }
  a:hover,
  button:hover {
    transition: all 200ms ease-in-out;
    transform: translate3d(0,calc(-1 * var(--u-1p)),0);
  }
  a:active,
  button:active {
    transition: all 100ms ease-in-out;
    transform: translate3d(0,calc(var(--u-1p)),0);
  }
  a::after,
  button::after {
    content: '';
    display: block;
    border-radius: 1rem;
    top: 0;
    left: 0;
    bottom: 0;
    width: 100%;
    position: absolute;
    box-shadow: rgba(17, 17, 26, 0.1) 0px 1px 0px, rgba(17, 17, 26, 0.1) 0px 8px 24px, rgba(17, 17, 26, 0.1) 0px 16px 48px;
    opacity: 0;
    transition: all 200ms ease-in-out;
  }
  a:hover::after,
  button:hover::after {
    opacity: 1;
    transition: all 200ms ease-in-out;
  }

  .large {
    font-size: var(--s-18);
    padding: calc(var(--u-3p) + var(--u-6p)) calc(1rem + var(--u-6p));

    border-radius: 1rem;
  }
  .large:hover {
    transform: translate3d(0,calc(-1 * var(--u-2p)),0);
  }
  .large:active {
    transform: translate3d(0,calc(var(--u-1p)),0);
  }


</style>

{#if href}
  <a
    class={`${large ? 'large' : ''}`}
    href={href}>
    <slot></slot>
  </a>
{:else}
  <button
    class={`${large ? 'large' : ''}`}>
    <slot></slot>
  </button>
{/if}