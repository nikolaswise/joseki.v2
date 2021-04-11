<script>
  export let stone
  export let x
  export let y
  export let size
  export let staged
</script>

<hr class={y === 0 ? 'x f' : y === (size - 1) ? 'x l' : 'x'}>
<hr class={x === 0 ? 'y t' : x === (size - 1) ? 'y b' : 'y'}>
<span>
  {#if stone == 'x'}
    ⚫
  {:else if stone == 'o'}
    ⚪
  {:else if staged}
    ?
  {:else}

  {/if}
</span>

<style>
  span {
    position: absolute;
    top: 0;
    display: grid;
    height: 100%;
    width: 100%;
    justify-content: center;
    align-content: center;
  }
  hr {
    position: absolute;
    border: none;
    outline: none;
    display: block;
    margin: 0;
  }
  hr.x {
    left: 0;
    right: 0;
    top: 50%;
    border-top: 2px solid black;
  }
  hr.x.f {
    left: 50%;
  }
  hr.x.l {
    right: 50%;
  }
  hr.y {
    left: 50%;
    border-left: 2px solid black;
    height: 100%;
  }
  hr.y.t {
    height: 50%;
    top: 50%;
  }
  hr.y.b {
    height: 50%;
    top: 0%;
  }
</style>