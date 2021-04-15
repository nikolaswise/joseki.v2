<script>
  import { onMount } from 'svelte'
  export let color = 'black'
  export let size = 'medium'
  export let animate = false
  export let onBoard = false
  export let count = 8
  export let drift = 40
  export let deform = 80
  export let speed = 3000

  let blob

  const blobbers = new Array(count)

  const getRando = () => Math.floor(Math.random() * (drift * 2)) - drift
  const animateBlobbers = (blobbers) => {
    blobbers.forEach(blobber => {
      blobber.style.transform = `translate3d(${getRando()}%, ${getRando()}%, 0)`;
    })
    setTimeout(function() {
      animateBlobbers(blobbers)
    }, speed)
  }
  onMount(() => {
    if (animate) {
      let blobbers = [...blob.querySelectorAll('.blobber')]
      blobbers.forEach(blobber => {
        blobber.style.height = `${deform}%`
        blobber.style.width = `${deform}%`
        blobber.style.top = `${(100 - deform) / 2}%`
        blobber.style.right = `${(100 - deform) / 2}%`
        blobber.style.transitionDuration = `${speed}ms`;
        blobber.style.transform = `translate3d(0%, 0%, 0)`;
      })
      setTimeout(function() {
        animateBlobbers(blobbers)
      }, '1ms')
      // animateBlobbers(blobbers)
    }
  })
</script>

<style>
  .blob {
    position: relative;
    display: inline-block;
    margin: var(--u-1p);
    height: var(--s-18);
    width: var(--s-18);
    background-color: var(--color-black);
    border-radius: 100%;
  }

  .white {
    background-color: var(--color-white);
  }

  .small {
    height: var(--s-10);
    width: var(--s-10);
  }

  .onboard {
    height: calc(100% - var(--u-2p));
    width: calc(100% - var(--u-2p));
    position: absolute;
    margin: 0;
    z-index: 100;
  }

  .large {
    height: var(--s-36);
    width: var(--s-36);
  }

  .animate {
    filter: url("#goo");
  }

  .blobber {
    width: 60%;
    height: 60%;
    left: 20%;
    top: 20%;
    background-color: inherit;
    border-radius: 100%;
    display: inline-block;
    position: absolute;
    transition-timing-function: linear;
  }
</style>

<div
  bind:this={blob}
  class={`
    blob
    ${color == 'white' ? 'white' : 'black'}
    ${onBoard ? 'onboard' : ''}
    ${size == 'small' ? 'small' : ''}
    ${size == 'large' ? 'large' : ''}
    ${animate ? 'animate' : ''}
  `}
>
  {#if animate}
    {#each blobbers as blobber, index (index)}
      <div
        class="blobber">
      </div>
    {/each}
  {/if}
</div>