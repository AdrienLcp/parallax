/**
 * Bumped whenever a message shape changes in a way an older peer cannot read.
 * Both ends ship from this repository, so the only realistic mismatch is a tab
 * left open across a deploy: `hello` carries the client's version, and the
 * server refuses it rather than let a stale screen misread the room.
 */
export const PROTOCOL_VERSION = 4
