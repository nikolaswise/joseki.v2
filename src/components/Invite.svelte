<script>
  import CopyToClipboard from './CopyToClipboard.svelte'

  export let invite

  let ref
  let input
</script>


<label>
  Invite Opponent:
  <span class="flex">
    <input
      bind:this={input}
      autofocus
      type="text"
      value={`${window.location}?${invite}`}>
    <CopyToClipboard {input}>
      Copy
    </CopyToClipboard>
  </span>
</label>

<style>
  .flex {
    display: flex
  }
  span {
    margin-top: var(--u-3p);
  }
  input {
    width: 100%;
    font-family: 'Input';
  }
</style>


