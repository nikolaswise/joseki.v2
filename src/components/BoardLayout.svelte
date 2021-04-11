<div class="container">
  <div class="meta">
    <slot name="meta">
      I am the details
    </slot>
  </div>
  <div class="board">
    <slot name="board">
      I am the board
    </slot>
  </div>
</div>

<style>
  .container {
    display: flex;
    flex-wrap: wrap;
    padding: 2rem;
  }
  .meta {
    flex-grow: 2;
    flex-basis: 200px;
  }
  .board {
    flex-basis: 750px;
    flex-grow: 1;
  }
</style>