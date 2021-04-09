<script>
  import { writable } from 'svelte/store';
  export let input

  const didCopy = writable(false)

  const copyToClipboard = () => {
    let text = input.value
    navigator.clipboard.writeText(text)
      .then(r => {
        $didCopy = true
        input.focus()
        input.select()
      })
      .catch(err => {
        input.focus()
        input.select()
      })
  }
</script>

<button
  on:click={copyToClipboard}>
  {$didCopy ? '✅' : '📋'}&nbsp;<slot></slot>
</button>