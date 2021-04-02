<script>
  import Button from './Button.svelte'
  import Lockup from './Lockup.svelte'
</script>

<div class="home">
  <nav>
    <Lockup stacked={true}/>
    <Button
      href="/new">
      New Game
    </Button>
  </nav>
</div>

<style>
  .home {
    display: grid;
    align-items: center;
    height: 100%;
  }
  nav {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 9rem;
    margin: auto;
    padding-bottom: 4rem;
  }

</style>