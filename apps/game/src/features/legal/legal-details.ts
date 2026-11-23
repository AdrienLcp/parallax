/**
 * Who publishes the site and how to reach them. A project replaces both
 * before it ships: a non-professional publisher gives a name and a contact,
 * never a postal address or a phone number.
 */
export const PUBLISHER = {
  contactHref: 'https://example.com/contact',
  name: 'Publisher Name'
} as const

/** Every site is hosted on Cloudflare Pages or Workers. */
export const HOST = {
  addressLines: ['101 Townsend St', 'San Francisco, CA 94107', 'USA'],
  name: 'Cloudflare, Inc.'
} as const

/** The longest the measurement's raw records are kept, the CNIL's ceiling. */
export const MEASUREMENT_RETENTION_MONTHS = 25

export const CNIL_COMPLAINT_HREF = 'https://www.cnil.fr/fr/plaintes'
