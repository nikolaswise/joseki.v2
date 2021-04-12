export const submitMove = (game, games, player) => (event) => {
  console.log(player)
  game.history.push([
    player,
    event.detail.x,
    event.detail.y
  ])
  game.consecutivePasses = 0
  game.turn = game.turn == 'white' ? 'black' : 'white'
  games.y.set(game.name, JSON.stringify(game))
}

export const pass = (game, games, player) => (event) => {
  console.log('pass!')
}

export const resign = (game, games, player) => (event) => {
  console.log('resign!')
}