/**
 * Typed Middleware Pipeline — Solaris World-Class (#28)
 *
 * Instead of scattered middleware, build a typed pipeline where each
 * step can transform the request and pass data to the next step.
 * Every step is independently testable.
 */

import type { NextRequest, NextResponse } from 'next/server'

type NextFunction<T> = (ctx: T) => Promise<T>
type MiddlewareFunction<T> = (ctx: T, next: NextFunction<T>) => Promise<T>

export function createPipeline<T>() {
  const middlewares: MiddlewareFunction<T>[] = []

  return {
    use(fn: MiddlewareFunction<T>) {
      middlewares.push(fn)
      return this
    },

    async execute(initialCtx: T): Promise<T> {
      let index = 0

      const next: NextFunction<T> = async (ctx) => {
        if (index >= middlewares.length) return ctx
        const middleware = middlewares[index++]
        return middleware(ctx, next)
      }

      return next(initialCtx)
    },
  }
}

/** Standard API context that flows through the pipeline */
export interface ApiContext {
  request: NextRequest
  response?: NextResponse
  user?: { id: string; role: string; email: string }
  startTime: number
  requestId: string
  body?: unknown
  params?: Record<string, string>
}
