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

export const pass = (game, games, player) => (event) => {
}

export const resign = (game, games, player) => (event) => {
}

export const acceptDeadStones = (game, games, player) => (event) => {
}

export const markDead = (game, games) => (event) => {
  let x = event.detail.x
  let y = event.detail.y
  let deadMap = new Map(game.deadStones)
  deadMap.set(`${x}${y}`, [x,y])
  game.deadStones = [...deadMap]
  games.y.set(game.name, JSON.stringify(game))
}

export const markAlive = (game, games) => (event) => {
  let deadMap = new Map(game.deadStones)
  deadMap.delete(`${event.detail.x}${event.detail.y}`)
  game.deadStones = [...deadMap]
  games.y.set(game.name, JSON.stringify(game))
}

export const endGame = (game, games) => (score) => {
  let winner = score > 0 ? 'black' : 'white'
  game.winner = winner
  game.score = Math.abs(score)
  games.y.set(game.name, JSON.stringify(game))
}