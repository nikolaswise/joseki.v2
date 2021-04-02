<script>
  import Button from './Button.svelte'
  import Lockup from './Lockup.svelte'
</script>

<nav>
  <a href="/">
    <Lockup stacked={false} small={true}/>
  </a>
  <Button
    href="/new">
    New Game
  </Button>
</nav>
