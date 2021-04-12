<script>
  import { resign, pass } from './game-actions.js'

  export let game
  export let games
  export let color

  submitMove(game, games, board.getCurrentPlayer())
</script>

<div class="actions">
  <button disabled={!play}>Pass</button>
  <button disabled={!play}>Resign</button>
</div>