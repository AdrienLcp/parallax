import { defineDictionary, defineTranslation } from '@adrienlcp/i18n'

export const EN_DICTIONARY = defineDictionary({
  games: {
    sumo: { name: 'Sumo' }
  },
  home: {
    host: 'Host',
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
  play: {
    reconnecting: 'Reconnecting…',
    refused: {
      outdated: 'This page is out of date. Reload it.',
      roomFull: 'This room is full.',
      roomGone: 'No room here.',
      unexpected: 'The room turned you away.'
    }
  },
  screen: {
    openFailed: 'The room did not open.',
    reconnecting: 'Reconnecting…',
    refused: 'The room turned this display away.',
    replaced: 'Another display took this room.',
    retry: 'Retry',
    takeBack: 'Take back'
  },
  seat: {
    away: 'Player {number} · away',
    present: 'Player {number}'
  },
  shell: {
    footer: {
      credit: 'Made by <author>{name}</author>',
      legal: 'Legal notice and privacy',
      source: 'Source code'
    },
    skipLink: 'Skip to content'
  }
})
