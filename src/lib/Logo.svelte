<script>
  import Blob from './Blob.svelte'

  export let small = false

  let size = small ? 'small' : 'large'
</script>

<style>
   @keyframes orbitBlack {
    0% {
      transform: translate3d(0%,0,0);
      z-index: 1;
    }
    50% {
      transform: translate3d(150%,0,0);
      z-index: 1;
    }
    51% {
      z-index: 2;
    }
    100% {
      transform: translate3d(0%,0,0);
      z-index: 2;
    }
  }
   @keyframes orbitWhite {
    0% {
      transform: translate3d(0%,0,0);
      z-index: 2;
    }
    33% {
      z-index: 1;
    }
    50% {
      transform: translate3d(-150%,0,0);
      z-index: 1;
    }
    100% {
      transform: translate3d(0%,0,0);
      z-index: 1;
    }
  }

  .logo {
    display: flex;
    width: 8rem;
    justify-content: space-between;
  }
  .black {
    width: 40%;
    animation: orbitBlack 4.5s infinite;
    animation-timing-function: ease-in-out;
  }
  .white {
    width: 40%;
    animation: orbitWhite 4.5s infinite;
    animation-timing-function: ease-in-out;
  }
</style>

<div class="logo">
  <div class="black">
    <Blob animate={true} size={size} />
  </div>
  <div class="white">
    <Blob animate={true} size={size} color="white"/>
  </div>
</div>