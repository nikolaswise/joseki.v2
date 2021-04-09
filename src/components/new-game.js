export const newGame = (RTC, player) => ({name, komi, size, color}) => {
  console.log(name, komi, size, color)
  let gameData = {
    name: `/${name}`,
    komi: komi,
    size: size,
    turn: 'black',
    winner: null,
    resignation: false,
    score: null,
    consecutivePasses: 0,
    players: 1,
    accepted: {
      black: false,
      white: false,
    },
    history: [],
    deadStones: [],
  }

  console.log('create a new game!')
  RTC.y.set(gameData.name, JSON.stringify(gameData))
  player.update(p => p.set(gameData.name, color))

  console.log(RTC)

  return gameData.name
}