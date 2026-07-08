type CvWrap = { type?: unknown; value?: unknown }

function isCvWrap(value: unknown): value is CvWrap {
  return typeof value === 'object' && value !== null && 'value' in value
}

/** Unwrap cvToValue scalar / optional leaves to plain JS values. */
export function clarityScalar(value: unknown): unknown {
  if (value == null || typeof value !== 'object') return value
  if (!isCvWrap(value)) return value

  const inner = value.value
  if (inner == null) return null

  if (typeof inner === 'object' && isCvWrap(inner)) {
    const outerType = typeof value.type === 'string' ? value.type : ''
    if (outerType.includes('optional') || outerType.includes('response')) {
      return clarityScalar(inner)
    }
    if (typeof inner.type === 'string') return clarityScalar(inner)
  }

  return inner
}

export function clarityBool(value: unknown): boolean {
  const scalar = clarityScalar(value)
  if (scalar === true || scalar === 'true') return true
  if (scalar === false || scalar === 'false') return false
  if (typeof scalar === 'number' || typeof scalar === 'bigint') return Number(scalar) > 0
  return false
}

export function clarityUint(value: unknown): number {
  const scalar = clarityScalar(value)
  if (scalar == null || scalar === false) return 0
  return Number(scalar)
}

export function clarityString(value: unknown): string {
  const scalar = clarityScalar(value)
  return scalar == null ? '' : String(scalar)
}

export function clarityPrincipal(value: unknown): string {
  return clarityString(value)
}

/** Flatten cvToValue tuple responses to plain field objects. */
export function clarityTuple(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null

  const obj = value as CvWrap
  let fields: Record<string, unknown>

  if (typeof obj.type === 'string' && String(obj.type).includes('tuple') && obj.value && typeof obj.value === 'object') {
    fields = obj.value as Record<string, unknown>
  } else if (obj.value && typeof obj.value === 'object' && !Array.isArray(obj.value)) {
    fields = obj.value as Record<string, unknown>
  } else {
    fields = value as Record<string, unknown>
  }

  const out: Record<string, unknown> = {}
  for (const [key, field] of Object.entries(fields)) {
    if (key === 'type') continue
    out[key] = clarityScalar(field)
  }

  return Object.keys(out).length ? out : null
}

export function clarityOptionalSome(value: unknown): boolean {
  if (value === true) return true
  if (value == null || value === false) return false
  if (typeof value !== 'object') return Boolean(value)

  const obj = value as CvWrap
  if (typeof obj.type === 'string' && obj.type.includes('none')) return false
  if (obj.value == null) return false
  if (typeof obj.type === 'string' && obj.type.includes('optional')) {
    return clarityOptionalSome(obj.value)
  }

  return clarityBool(obj)
}

export function clarityOptionalUint(value: unknown): number | null {
  if (value == null || value === false) return null
  const obj = value as CvWrap
  if (typeof obj.type === 'string' && obj.type.includes('none')) return null
  const scalar = clarityScalar(value)
  if (scalar == null || scalar === false) return null
  return Number(scalar)
}
