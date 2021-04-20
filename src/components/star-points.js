const StarPoints = new Map()

const x19 = [
  [3, 3],
  [3, 9],
  [3, 15],
  [9, 3],
  [9, 9],
  [9, 15],
  [15, 3],
  [15, 9],
  [15, 15],
]

const x13 = [
  [3, 3],
  [3, 9],
  [6, 6],
  [9, 3],
  [9, 9]
]


const x9 = [
  [2, 2],
  [2, 6],
  [4, 4],
  [6, 2],
  [6, 6]
]

StarPoints.set('19', x19)
StarPoints.set('13', x13)
StarPoints.set('9', x9)

export default StarPoints