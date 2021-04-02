<script>
  import Button from './Button.svelte'
  import Lockup from './Lockup.svelte'
</script>

<nav>
  <a href="/">
    <Lockup stacked={false} small={true}/>
  </a>
  <div class="actions">
    <Button
      href="/new">
      New Game
    </Button>
    <Button>
      ◐
    </Button>
  </div>

</nav>

<style>
  nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    max-width: 100%;
    padding-left: 1rem;
    padding-right: 1rem;
    margin: auto;
  }

  .actions {
    margin-bottom: 1rem;
  }
</style>