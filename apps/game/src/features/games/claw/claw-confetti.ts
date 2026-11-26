import {
  Color,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry
} from 'three'

/** Pieces in flight at most: a few bursts at once. */
const POOL_SIZE = 240
/** A piece's half width: it stops that far from an edge of the interior. */
const PIECE_HALF = 0.016
/** How long a piece lives, the last part of it shrinking away. */
const LIFE_SECONDS = 2.2
const SHRINK_SECONDS = 0.6
/** Soft, so a burst hangs long enough to read from across the room. */
const GRAVITY = 3
/** The slowest a piece falls once past its peak: paper flutters down. */
const FLUTTER_SPEED = 0.32
/** How fast the air slows a piece across and in depth, per second. */
const DRAG = 1.4

type Piece = {
  age: number
  readonly mesh: Mesh
  spinX: number
  spinY: number
  vx: number
  vy: number
  vz: number
}

/** The box the pieces stay in: the alcove's interior, in alcove units. */
export type ConfettiBounds = {
  readonly back: number
  readonly front: number
  readonly halfX: number
  readonly roof: number
}

export type Confetti = {
  readonly dispose: () => void
  readonly group: Group
  /** Throws `count` pieces up from a point, in the arcade's colours and `seat`'s if given. */
  readonly launch: (input: {
    count: number
    seat: Color | null
    x: number
    y: number
    z: number
  }) => void
  readonly step: (seconds: number) => void
}

/**
 * A burst of paper confetti out of a chute when a prize falls in: the pieces
 * shoot up and in towards the middle of the alcove, flutter down, spinning,
 * and shrink away. None crosses the interior's edges.
 */
export const buildConfetti = ({
  bounds,
  palette,
  random
}: {
  bounds: ConfettiBounds
  palette: readonly Color[]
  random: () => number
}): Confetti => {
  const group = new Group()
  const geometry = new PlaneGeometry(PIECE_HALF * 2, PIECE_HALF * 1.2)
  const paperOf = (color: Color) =>
    new MeshBasicMaterial({ color, side: DoubleSide })
  const papers = palette.map(paperOf)
  const seatPapers = new Map<string, MeshBasicMaterial>()
  const fallback = papers[0] ?? paperOf(new Color('#ffffff'))

  const pieces: Piece[] = Array.from({ length: POOL_SIZE }, () => {
    const mesh = new Mesh(geometry, fallback)
    mesh.visible = false
    group.add(mesh)
    return { age: LIFE_SECONDS, mesh, spinX: 0, spinY: 0, vx: 0, vy: 0, vz: 0 }
  })

  const seatPaper = (color: Color) => {
    const key = color.getHexString()
    let paper = seatPapers.get(key)
    if (paper === undefined) {
      paper = paperOf(color)
      seatPapers.set(key, paper)
    }
    return paper
  }

  const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value))

  return {
    dispose: () => {
      group.removeFromParent()
      geometry.dispose()
      for (const paper of [...papers, ...seatPapers.values()]) paper.dispose()
    },
    group,
    launch: ({ count, seat, x, y, z }) => {
      const colours = seat === null ? papers : [...papers, seatPaper(seat)]
      // Towards the middle: the chutes sit in the front corners.
      const inwardX = -Math.sign(x) * 0.22
      let thrown = 0
      for (const piece of pieces) {
        if (thrown >= count) break
        if (piece.age < LIFE_SECONDS) continue
        const angle = random() * Math.PI * 2
        const spread = 0.1 + random() * 0.35
        piece.age = 0
        piece.vx = Math.cos(angle) * spread + inwardX
        piece.vy = 1.7 + random() * 0.8
        piece.vz = Math.sin(angle) * spread - 0.12
        piece.spinX = (random() - 0.5) * 18
        piece.spinY = (random() - 0.5) * 12
        piece.mesh.material =
          colours[Math.floor(random() * colours.length)] ?? fallback
        piece.mesh.position.set(x, y, z)
        piece.mesh.rotation.set(random() * 6, random() * 6, 0)
        piece.mesh.scale.setScalar(1)
        piece.mesh.visible = true
        thrown += 1
      }
    },
    step: (seconds) => {
      if (seconds <= 0) return
      const slowed = Math.exp(-DRAG * seconds)
      for (const piece of pieces) {
        if (piece.age >= LIFE_SECONDS) continue
        piece.age += seconds
        if (piece.age >= LIFE_SECONDS) {
          piece.mesh.visible = false
          continue
        }
        piece.vx *= slowed
        piece.vz *= slowed
        piece.vy = Math.max(-FLUTTER_SPEED, piece.vy - GRAVITY * seconds)
        const { position, rotation } = piece.mesh
        position.x = clamp(
          position.x + piece.vx * seconds,
          -bounds.halfX + PIECE_HALF,
          bounds.halfX - PIECE_HALF
        )
        position.y = clamp(
          position.y + piece.vy * seconds,
          PIECE_HALF,
          bounds.roof - PIECE_HALF
        )
        position.z = clamp(
          position.z + piece.vz * seconds,
          bounds.back + PIECE_HALF,
          bounds.front - PIECE_HALF
        )
        rotation.x += piece.spinX * seconds
        rotation.y += piece.spinY * seconds
        const left = LIFE_SECONDS - piece.age
        piece.mesh.scale.setScalar(Math.min(1, left / SHRINK_SECONDS))
      }
    }
  }
}
