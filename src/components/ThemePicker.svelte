<script>
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
    document.body.classList = ''
    document.body.classList.add(theme)
  }

</script>

<style>
  .menu {
    display: inline-block;
    z-index: 100;
    filter: url("#shadowed-goo");
  }

  .menu-item, .menu-open-button {
    text-decoration: none;
    background: var(--color-figure);
    border-radius: 100%;
    width: 3rem;
    height: 3rem;
    margin-left: -1rem;
    position: absolute;
    top: 20px;
    color: var(--color-ground);
    text-align: center;
    line-height: 3rem;
    transform: translate3d(0, 0, 0);
    transition: transform ease-out 200ms;
  }

  .menu-open {
    display: none;
  }

  .menu {
    margin-top: 4rem;
    padding-top: 4rem;
    padding-left: 4rem;
    box-sizing: border-box;
    text-align: left;
    transform: translate3d(-50%, 0, 0);
  }

  .menu-item:nth-child(3) {
    transition-duration: 70ms;
  }
  .menu-item:nth-child(4) {
    transition-duration: 130ms;
  }
  .menu-item:nth-child(5) {
    transition-duration: 190ms;
  }
  .menu-item:nth-child(6) {
    transition-duration: 250ms;
  }
  .menu-item:nth-child(7) {
    transition-duration: 310ms;
  }

  .menu-open-button {
    z-index: 2;
    transition-timing-function: cubic-bezier(0.175, 0.885, 0.32, 1.275);
    transition-duration: 400ms;
    transform: scale(1.1, 1.1) translate3d(0, 0, 0);
    cursor: pointer;
  }

  .menu-open-button:hover {
    transform: scale(1.2, 1.2) translate3d(0, 0, 0);
  }

  .menu-open:checked + .menu-open-button {
    transition-timing-function: linear;
    transition-duration: 200ms;
    transform: scale(0.8, 0.8) translate3d(0, 0, 0);
  }

  .menu-open:checked ~ .menu-item {
    transition-timing-function: cubic-bezier(0.935, 0, 0.34, 1.33);
  }
  .menu-open:checked ~ .menu-item:nth-child(3):hover {
    transform: translate3d(-3.97199rem, -0.47252rem, 0) scale(1.2);
  }
  .menu-open:checked ~ .menu-item:nth-child(3) {
    transition-duration: 160ms;
    transform: translate3d(-3.97199rem, -0.47252rem, 0);
  }
  .menu-open:checked ~ .menu-item:nth-child(4):hover {
    transform: translate3d(-2.62968rem, -3.0141rem, 0) scale(1.2);
  }
  .menu-open:checked ~ .menu-item:nth-child(4) {
    transition-duration: 240ms;
    transform: translate3d(-2.62968rem, -3.0141rem, 0);
  }
  .menu-open:checked ~ .menu-item:nth-child(5):hover {
    transform: translate3d(0.07044rem, -3.99938rem, 0) scale(1.2);
  }
  .menu-open:checked ~ .menu-item:nth-child(5) {
    transition-duration: 320ms;
    transform: translate3d(0.07044rem, -3.99938rem, 0);
  }
  .menu-open:checked ~ .menu-item:nth-child(6):hover {
    transform: translate3d(2.73419rem, -2.91963rem, 0) scale(1.2);
  }
  .menu-open:checked ~ .menu-item:nth-child(6) {
    transition-duration: 400ms;
    transform: translate3d(2.73419rem, -2.91963rem, 0);
  }
  .menu-open:checked ~ .menu-item:nth-child(7):hover {
    transform: translate3d(3.98617rem, -0.33236rem, 0) scale(1.2);
  }
  .menu-open:checked ~ .menu-item:nth-child(7) {
    transition-duration: 480ms;
    transform: translate3d(3.98617rem, -0.33236rem, 0);
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

  <input type="checkbox" class="menu-open" name="menu-open" id="menu-open"/>

  <label class="menu-open-button" for="menu-open">
    ◐
  </label>
  {#each themes as theme}
    <a
      on:click={setTheme}
      href="#"
      class={`menu-item js-switch-theme blank-marker theme-${theme.toLowerCase()}`}
      data-theme={`theme-${theme.toLowerCase()}`}>
      ⬤
    </a>
  {/each}
</nav>