'use client'

import { logError } from './debug-logger'

export async function debugFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
  const method = init?.method || 'GET'

  try {
    const res = await fetch(input, init)

    if (!res.ok) {
      let errorBody: Record<string, unknown> = {}
      try {
        errorBody = await res.clone().json()
      } catch {
        try {
          errorBody = { text: await res.clone().text() }
        } catch {
          errorBody = { note: 'Could not read response body' }
        }
      }

      logError(
        `API ${method} ${url.replace(/^.*\/api\//, '/api/')}`,
        (errorBody as { error?: string }).error || `HTTP ${res.status}`,
        {
          status: res.status,
          url,
          method,
          responseBody: errorBody,
          requestBody: init?.body ? tryParseJson(init.body) : undefined,
        }
      )
    }

    return res
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network error'
    logError(
      `API ${method} ${url.replace(/^.*\/api\//, '/api/')}`,
      message,
      {
        url,
        method,
        errorType: 'network',
        requestBody: init?.body ? tryParseJson(init.body) : undefined,
      }
    )
    throw err
  }
}

function tryParseJson(body: BodyInit | null | undefined): unknown {
  if (typeof body === 'string') {
    try {
      return JSON.parse(body)
    } catch {
      return body
    }
  }
  return '[non-string body]'
}
