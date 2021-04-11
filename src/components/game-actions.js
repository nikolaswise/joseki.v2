export const submitMove = (game, games, player) => (event) => {
  game.history.push([
    player,
    event.detail.x,
    event.detail.y
  ])
  game.consecutivePasses = 0
  game.turn = game.turn == 'white' ? 'black' : 'white'
  games.y.set(game.name, JSON.stringify(game))
}