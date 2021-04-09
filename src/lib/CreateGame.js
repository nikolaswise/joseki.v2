export const createGame = async ({
  RTCData,
  name,
  komi,
  size,
}) => {
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
  console.log(gameData)
  RTCData.y.set(gameData.name, JSON.stringify(gameData))
  return `/${name}`

//
//   player.update(p => p.set(gameData.name, color))
//   let playerData = JSON.stringify([...$player.entries()])
//   localStorage.setItem('joseki-party', playerData)
//
//   window.history.pushState({}, '', name);
//   path.set(gameData.name)
//
//   console.log($games)
}