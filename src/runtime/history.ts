import type { AttributionSnapshot, DataObject, ModuleOptions } from './types'

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

export function retainHistory(
  entries: DataObject[],
  { maxAge, maxEntries }: Pick<ModuleOptions, 'maxAge' | 'maxEntries'>,
  now = Date.now(),
): DataObject[] {
  const retained =
    maxAge === undefined
      ? entries
      : entries.filter((entry) => now - Date.parse(entry.timestamp) < maxAge * 1000)
  return maxEntries === undefined ? retained : retained.slice(0, maxEntries)
}

export function getCampaignTouches(history: readonly DataObject[]) {
  const campaigns = history.filter(
    (entry) =>
      Object.values(entry.utmParams).some(Boolean) ||
      Object.values(entry.gclidParams ?? {}).some(Boolean),
  )
  return { firstTouch: campaigns.at(-1) ?? null, lastTouch: campaigns[0] ?? null }
}

export function createAttributionSnapshot(entries: readonly DataObject[]): AttributionSnapshot {
  const history: DataObject[] = JSON.parse(JSON.stringify(entries))
  return { ...getCampaignTouches(history), history }
}
