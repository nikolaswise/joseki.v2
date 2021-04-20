<script>
  import { fade, fly } from 'svelte/transition';

  const themes = [
    'Default',
    'Blue',
    'Orange',
    'Green',
    'IKB',
    'Classic',
    'Neutral',
    'Night '
  ]
  let themeClasses = themes.map(theme => `theme-${theme.toLowerCase()}`)
  const setTheme = (e) => {
    let theme = e.target.dataset.theme
     stashTheme(theme)
  }

  let isOpen = false
  const toggleMenu = () => isOpen = !isOpen

  const getStashedTheme = () => {
    let theme = window.localStorage.getItem('joseki-theme')
      document.body.classList = ''
    document.body.classList.add(theme)
  }
  const stashTheme = (theme) => {
    window.localStorage.setItem('joseki-theme', theme)
    getStashedTheme()
  }

  getStashedTheme()
</script>

<style>
  .menu {
    filter: url("#shadowed-goo");
  }
  .toggle-menu {
    display: none;
  }
  .menu-open-button {
    position: relative;
    background: var(--color-figure);
    border-radius: 100%;
    width: 3rem;
    height: 3rem;
    color: var(--color-ground);
    text-align: center;
    line-height: 3rem;
    transform: scale(1, 1);
    transition: transform ease-out 200ms;
    cursor: pointer;
  }
  .menu-open-button:hover {
    transform: scale(1.2, 1.2);
    transition: transform ease-out 200ms;
  }
  .menu-themes {
    position: absolute;
    display: flex;
    flex-direction: column;
    width: 3rem;
    align-items: center;
  }
  .theme-item {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 100%;
    background: var(--color-figure);
    color: var(--color-ground);
    margin-bottom: 0;
    border: none;
    transform: scale(1, 1);
    cursor: pointer;
    transition: transform ease-out 200ms;
  }
  .theme-item:hover {
    transform: scale(1.1, 1.1);
    transition: transform ease-out 200ms;
  }
</style>

<svg xmlns="http://www.w3.org/2000/svg" version="1.1" height="0" width="0">
  <defs>
    <filter id="shadowed-goo">
      <feGaussianBlur in="SourceGraphic" result="blur" stdDeviation="10" />
      <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -9" result="goo" />
      <feGaussianBlur in="goo" stdDeviation="3" result="shadow" />
      <feColorMatrix in="shadow" mode="matrix" result="shadow" />
      <feOffset in="shadow" dx="1" dy="1" result="shadow" />
      <feComposite in2="shadow" in="goo" result="goo" />
      <feComposite in2="goo" in="SourceGraphic" result="mix" />
    </filter>
  </defs>
</svg>

<nav class="theme-switcher menu">

  <input
    type="checkbox"
    on:change={toggleMenu}
    class="toggle-menu"
    name="toggle-menu"
    id="toggle-menu"/>

  <label class="menu-open-button" for="toggle-menu">
    ◐
  </label>

  {#if isOpen}
    <div class="menu-themes">
      {#each themes as theme, i}
        <button
          in:fly="{{ y: -10, delay: (20 * i) }}"
          out:fly="{{ y: -10, delay: (20 * themes.length) - (20 * i) }}"
          on:click={setTheme}
          class={`theme-item theme-${theme.toLowerCase()}`}
          data-theme={`theme-${theme.toLowerCase()}`}>
          ⬤
        </button>
      {/each}
    </div>
  {/if}
</nav>