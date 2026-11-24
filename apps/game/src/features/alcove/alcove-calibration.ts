/** A point of the display, as shares of its width (from the left) and height (from the top). */
export type ScreenShare = { readonly x: number; readonly y: number }

/**
 * The alcove as the players see it, traced on the display from their spot:
 * the back wall's corners, the opening's floor and roof corners, and how far
 * their eyes stand from the screen.
 */
export type AlcoveCalibration = {
  readonly back: {
    readonly bottomLeft: ScreenShare
    readonly bottomRight: ScreenShare
    readonly topLeft: ScreenShare
    readonly topRight: ScreenShare
  }
  /** From the players' eyes to the screen, in screen heights. */
  readonly eyeDistance: number
  readonly front: {
    readonly floorLeft: ScreenShare
    readonly floorRight: ScreenShare
    readonly roofLeft: ScreenShare
    readonly roofRight: ScreenShare
  }
}
