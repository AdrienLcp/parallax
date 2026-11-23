import type { Context, ErrorHandler } from 'hono'
import { HTTPException } from 'hono/http-exception'

import type { ApiErrorResponse } from '@parallax/protocol/http'

const notFoundBody: ApiErrorResponse = {
  code: 'not_found',
  message: 'No route behind this address'
}

const internalErrorBody: ApiErrorResponse = {
  code: 'internal_error',
  message: 'Unexpected failure'
}

export const answerNotFound = (context: Context) =>
  context.json(notFoundBody, 404)

export const answerInternalError = (context: Context) =>
  context.json(internalErrorBody, 500)

export const answerUnexpected: ErrorHandler = (error, context) => {
  if (error instanceof HTTPException) {
    const body: ApiErrorResponse = {
      code: 'invalid_input',
      message: error.message
    }

    return context.json(body, error.status)
  }

  console.error({ error, message: 'Unhandled error', path: context.req.path })

  return answerInternalError(context)
}
