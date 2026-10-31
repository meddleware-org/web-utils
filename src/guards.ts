// Small guards for data that arrives from outside (storage, a response, another tab): check the shape, never trust it.

/** A plain object (not null, not an array). */
export const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

/** The string, if it is one and no longer than `max`; otherwise `null`. */
export const str = (v: unknown, max: number): string | null => (typeof v === 'string' && v.length <= max ? v : null)
