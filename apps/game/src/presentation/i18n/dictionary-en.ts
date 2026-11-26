import { defineDictionary, defineTranslation } from '@adrienlcp/i18n'

export const EN_DICTIONARY = defineDictionary({
  claw: {
    cue: {
      aim: 'Steer the claw',
      chute: 'Drop it in a chute',
      grab: 'Grab a prize'
    },
    drop: 'Drop',
    grab: 'Grab',
    map: 'Map of the pit, seen from above',
    outcome: {
      lost: 'Lost',
      tie: 'Tie',
      won: 'Won'
    },
    points: defineTranslation('{points:plural}', {
      plural: { points: { one: '{?} point', other: '{?} points' } }
    }),
    prize: {
      bear: 'the bear',
      bunny: 'the bunny',
      capsule: 'a capsule',
      duck: 'the duck',
      octopus: 'the octopus'
    },
    standings: {
      caught: '{seat} grabs {prize}',
      cue: 'Most points in 1 min · capsule = 3',
      noWinner: 'Nobody caught anything',
      tie: 'Tie: {seats:list}',
      timeLeft: '{seconds:number} s left',
      timeUp: 'Time’s up',
      title: 'The claw',
      won: '{seat} wins · {points}'
    }
  },
  games: {
    claw: { name: 'Claw' },
    sumo: { name: 'Sumo' },
    tower: { name: 'Tower' }
  },
  home: {
    games: 'Games',
    open: 'Open the room',
    title: 'Parallax'
  },
  legal: {
    host: {
      body: 'The site is hosted by:',
      heading: 'Host'
    },
    intro:
      'Who publishes this site, what it keeps about you, and how to change that.',
    measurement: {
      body: 'Visits are counted by a tool I built, without cookies. A page view records the page’s address, the site you came from, your browser’s language and theme, and the width of its window. It records no IP address, and nothing that tells one visitor from another.',
      counted: 'Your visits are counted, anonymously.',
      exemption:
        'This measurement needs no consent under the CNIL’s guidelines, and you can still refuse it for this browser.',
      heading: 'Audience measurement',
      refused: 'Your visits are not counted in this browser.',
      refusedByBrowser:
        'Your browser sends Global Privacy Control, so your visits are never counted.',
      retention: defineTranslation(
        'Each record is kept {months:plural} at most.',
        {
          plural: { months: { one: '{?} month', other: '{?} months' } }
        }
      ),
      saveFailed:
        'Your browser did not keep this choice. Try again, or turn on Global Privacy Control.',
      storageBlocked:
        'This browser blocks site storage, so a refusal cannot be kept here. Turning on Global Privacy Control in your browser refuses measurement on every site.',
      switch: 'Count my visits'
    },
    publisher: {
      address:
        'As a non-professional publisher, I give the host’s identity in place of a postal address (LCEN, article 6-III-2).',
      body: 'This site is published by {name}, a private individual, not a business. You can write to me through <contact>this contact page</contact>.',
      heading: 'Publisher'
    },
    rights: {
      body: 'Under the GDPR, you may access, correct or erase what concerns you, or object to its use. Ask through <contact>the contact page</contact>; I answer within a month.',
      complaint:
        'If you believe your rights are not respected, you may lodge a complaint with the <authority>CNIL</authority>.',
      heading: 'Your rights'
    },
    storage: {
      analyticsOptOut:
        'Your refusal of audience measurement, if you turn it off below.',
      device:
        'This site sets no cookies. What it remembers stays in your browser, for this site only, until you clear it:',
      heading: 'What this site stores',
      server: 'Nothing about you is kept on a server.',
      theme: 'The theme you picked, light or dark.'
    },
    thirdParties: {
      body: 'Your browser talks to this site only. Its host, Cloudflare, receives your IP address with each request, to deliver the page and protect the site from abuse.',
      heading: 'Who else receives your data'
    },
    title: 'Legal notice and privacy'
  },
  lobby: {
    fewest: 'At least {fewest:number} players',
    game: 'Game',
    leave: 'Leave',
    name: 'Nickname',
    ready: 'Ready',
    readyCount: defineTranslation('{ready:plural} of {present:number} ready', {
      plural: { ready: { one: '{?}', other: '{?}' } }
    })
  },
  play: {
    connecting: 'Connecting…',
    reconnecting: 'Reconnecting…',
    refused: {
      left: 'You left the room',
      outdated: 'Page out of date',
      removed: 'Removed from the room',
      roomFull: 'Room full',
      roomGone: 'No room here',
      unexpected: 'Turned away'
    },
    retry: 'Try again',
    room: 'Room'
  },
  score: defineTranslation('{score:plural} won of {goal:number}', {
    plural: { score: { one: '{?} round', other: '{?} rounds' } }
  }),
  screen: {
    backToGames: {
      hold: 'Back to games (hold)',
      label: 'Games'
    },
    fullscreen: 'Full screen',
    join: 'Scan to play',
    openFailed: 'The room did not open.',
    opening: 'Opening the room',
    players: '{fewest:number} to {most:number} players',
    qr: 'QR code to join room {code}',
    reconnecting: 'Reconnecting…',
    refused: 'The room turned this display away.',
    replaced: 'Another display took this room.',
    retry: 'Retry',
    roomCode: 'Room code',
    seat: {
      absent: 'away',
      free: 'Free',
      kick: 'Remove {name} from the room'
    },
    sound: 'Sound',
    stopGame: {
      hold: 'Stop the game (hold)',
      label: 'Stop'
    },
    takeBack: 'Take back'
  },
  seat: {
    black: 'Black',
    blue: 'Blue',
    green: 'Green',
    ivory: 'Ivory',
    ochre: 'Ochre',
    red: 'Red'
  },
  shell: {
    footer: {
      credit: 'Made by <author>{name}</author>',
      legal: 'Legal notice and privacy',
      source: 'Source code'
    },
    skipLink: 'Skip to content'
  },
  sumo: {
    cue: {
      dodge: 'Jump to dodge',
      knockOut: 'Knock them off the table',
      steer: 'Steer with your thumb'
    },
    dash: 'Dash',
    jump: 'Jump',
    out: {
      pushedBy: 'by <seat>{name}</seat>',
      title: 'Fallen off'
    },
    standings: {
      ejected: defineTranslation('{seats:list} {count:plural}', {
        plural: { count: { one: 'fell off', other: 'fell off' } }
      }),
      firstTo: defineTranslation('First to {rounds:plural}', {
        plural: { rounds: { one: '{?} round', other: '{?} rounds' } }
      }),
      inPlay: defineTranslation('{count:plural}', {
        plural: { count: { one: '{?} in play', other: '{?} in play' } }
      }),
      matchWon: '{seat} wins the match',
      round: 'Round {number:number}',
      roundDrawn: 'Round drawn',
      roundWon: '{seat} wins the round'
    },
    won: {
      match: 'Match won',
      round: 'Round won'
    }
  },
  tower: {
    block: {
      arch: 'Arch',
      cube: 'Cube',
      cylinder: 'Cylinder',
      plank: 'Plank',
      triangle: 'Triangle'
    },
    cue: {
      aim: 'Aim across and in depth',
      drop: 'Drop it on the tower'
    },
    drop: 'Drop',
    height: {
      centimetres: '{cm:number} cm',
      metres: '{metres:number} m {cm}'
    },
    next: 'Next',
    outcome: {
      ceiling: 'Up to the roof',
      lost: 'Lost',
      toppled: 'You toppled it',
      won: 'You win'
    },
    rule: {
      label: 'Rule',
      race: 'Height race',
      shared: 'One tower'
    },
    standings: {
      ceiling: 'The tower touches the roof',
      race: 'Race',
      raceCue: 'The tallest wins',
      shared: 'The tower',
      sharedCue: 'Topple it and you lose',
      tie: 'A tie',
      timeLeft: '{seconds:number} s left',
      toppled: '{seat} toppled the tower',
      turnOf: '{seat} aims',
      won: '{seat} wins · {height}'
    },
    turn: {
      settling: 'Hold your breath…',
      theirs: '{seat} aims',
      yours: 'Your block'
    }
  },
  tuning: {
    backdrop: 'Backdrop',
    backdrops: {
      custom: 'Colour',
      felt: 'Felt',
      game: 'The game’s own',
      grey: 'Grey',
      ivory: 'Ivory',
      'lacquer-ink': 'Ink',
      slate: 'Slate',
      white: 'White'
    },
    camera: 'Camera',
    close: 'Close',
    download: 'Download',
    drum: 'Drum',
    fieldOfView: 'Field',
    fill: 'Fill',
    header: 'Header',
    height: 'Height',
    hud: 'Interface',
    light: 'Light',
    motion: 'Motion',
    orbit: 'Orbit',
    orbits: {
      always: 'Always',
      off: 'Off',
      waiting: 'Waiting'
    },
    pitch: 'Pitch',
    qr: 'QR',
    reset: 'Reset',
    roster: 'Roster',
    scene: 'Scene',
    shadow: 'Shadow',
    size: 'Size',
    speed: 'Speed',
    sway: 'Sway',
    title: 'Tuning',
    tops: 'Tops'
  }
})
