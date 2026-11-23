import type { z } from 'zod'

export type DecodeResult<TMessage> =
  | { message: TMessage; status: 'success' }
  | { reason: string; status: 'failure' }

/**
 * A WebSocket frame is an untrusted string, so both ends run every inbound
 * frame through the schema of the role that sent it. Malformed JSON and JSON
 * that is not a message collapse into one `failure`: the caller refuses the
 * frame either way.
 */
export const decodeMessage = <TMessage>(
  schema: z.ZodType<TMessage>,
  raw: string
): DecodeResult<TMessage> => {
  let parsedJson: unknown

  try {
    parsedJson = JSON.parse(raw)
  } catch {
    return { reason: 'frame is not valid JSON', status: 'failure' }
  }

  const validated = schema.safeParse(parsedJson)

  if (!validated.success) {
    return {
      reason: validated.error.issues.map(describeIssue).join('; '),
      status: 'failure'
    }
  }

  return { message: validated.data, status: 'success' }
}

/**
 * Encodes *through* the schema: Zod drops the keys the schema does not name,
 * so a screen-shaped value sent to a phone cannot carry the screen's fields.
 * Throws on a message that breaks its own schema: a bug in the sender, not
 * bad input.
 */
export const encodeChecked = <TMessage>(
  schema: z.ZodType<TMessage>,
  message: TMessage
): string => JSON.stringify(schema.parse(message))

/** The path and the rule, never the received value, which ends up in logs. */
const describeIssue = (issue: z.core.$ZodIssue): string =>
  `${issue.path.join('.') || '<root>'}: ${issue.code}`
