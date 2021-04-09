<script>
  import { onMount, onDestroy, tick } from "svelte"
  import CopyToClipboard from './CopyToClipboard.svelte'

  export let invite
  export let initialFocusElement
  export let returnFocusElement

  let ref
  let input
  let tabbableChildren
  let firstTabbableChild
  let lastTabbableChild
  let returnFocusElem

  onMount(async () => {
    returnFocusElem = returnFocusElement || document.activeElement
    tabbableChildren = [...ref.querySelectorAll("*")].filter((node) => node.tabIndex >= 0)
    firstTabbableChild = tabbableChildren[0]
    lastTabbableChild = tabbableChildren[tabbableChildren.length - 1]
    // Wait for children to mount before trying to focus `initialFocusElement`
    await tick()

    if (initialFocusElement) {
      initialFocusElement.focus()
    } else {
      const initialFocusElem = ref.querySelector("[autofocus]")
      initialFocusElem.focus()
    }

    const { body, documentElement: html } = document
    const scrollBarWidth = window.innerWidth - html.clientWidth
    const bodyPaddingRight =
      parseInt(window.getComputedStyle(body).getPropertyValue("padding-right")) || 0
    // 1. Fixes a bug in iOS and desktop Safari whereby setting `overflow: hidden` on
    //    the html/body does not prevent scrolling.
    // 2. Fixes a bug in desktop Safari where `overflowY` does not prevent scroll if an
    //   `overflow-x` style is also applied to the body.
    html.style.position = "relative" // [1]
    html.style.overflow = "hidden" // [2]
    body.style.position = "relative" // [1]
    body.style.overflow = "hidden" // [2]
    body.style.paddingRight = `${bodyPaddingRight + scrollBarWidth}px`
    return () => {
      html.style.position = ""
      html.style.overflow = ""
      body.style.position = ""
      body.style.overflow = ""
      body.style.paddingRight = ""
    }

  })

  onDestroy(() => {
    if (returnFocusElem) {
      returnFocusElem.focus()
    }
  })

  const handleKeydown = (event) => {
    if (event.key !== "Tab") {
      return
    }
    if (tabbableChildren.length === 0) {
      event.preventDefault()
    }
    if (event.shiftKey) {
      // Handle shift + tab
      if (document.activeElement === firstTabbableChild) {
        event.preventDefault()
        lastTabbableChild.focus()
      }
    } else {
      if (document.activeElement === lastTabbableChild) {
        event.preventDefault()
        firstTabbableChild.focus()
      }
    }
  }
</script>

<style>
  .modal {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    background-color: rgba(255,255,255,0.4);
    display: grid;
    align-content: center;
    justify-content: center;
    z-index: 1;
  }

  .modal-content {
    background-color: var(--color-ground);
    padding: 2rem;
    max-width: calc(100vw - 4rem);
    margin: 2rem;
    margin-bottom: 5rem;
    box-sizing: border-box;
    width: 22rem;
  }

  h2 {
    margin-top: 0;
  }

  .flex {
    display: flex
  }
  input {
    width: 100%;
  }
  p {
    margin: 0;
  }
</style>

<svelte:window on:keydown={handleKeydown} />

<div class="modal" aria-modal="true">
  <div class="modal-content" bind:this={ref}>
    <label>
      <h2>Invite Opponent:</h2>
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

    <p>
      Waiting for another player to joing. Once they do, the game will begin.
    </p>
  </div>
</div>
