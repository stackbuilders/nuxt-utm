import type { DataObject } from './types'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isStringMap = (value: unknown): boolean =>
  isRecord(value) &&
  Object.values(value).every((item) => item === undefined || typeof item === 'string')

export function isDataObject(value: unknown): value is DataObject {
  if (!isRecord(value) || !isRecord(value.additionalInfo)) return false
  const { additionalInfo } = value
  return (
    typeof value.timestamp === 'string' &&
    Number.isFinite(Date.parse(value.timestamp)) &&
    typeof value.sessionId === 'string' &&
    isStringMap(value.utmParams) &&
    (value.gclidParams === undefined || isStringMap(value.gclidParams)) &&
    (value.customParams === undefined || isRecord(value.customParams)) &&
    ['referrer', 'userAgent', 'language', 'landingPageUrl'].every(
      (key) => typeof additionalInfo[key] === 'string',
    ) &&
    isRecord(additionalInfo.screen) &&
    typeof additionalInfo.screen.width === 'number' &&
    Number.isFinite(additionalInfo.screen.width) &&
    typeof additionalInfo.screen.height === 'number' &&
    Number.isFinite(additionalInfo.screen.height)
  )
}
