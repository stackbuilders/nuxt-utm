// The manual campaign parameters Google Analytics 4 reads
export const UTM_PARAMETERS = [
  'utm_id',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_source_platform',
  'utm_term',
  'utm_content',
  'utm_creative_format',
  'utm_marketing_tactic',
] as const

// Google Ads sends gbraid or wbraid instead of gclid for some iOS clicks,
// and Display & Video 360 and Campaign Manager 360 tag their clicks with dclid
export const GOOGLE_CLICK_PARAMETERS = [
  'gclid',
  'gad_source',
  'gad_campaignid',
  'gbraid',
  'wbraid',
  'dclid',
] as const

export type UTMParameter = (typeof UTM_PARAMETERS)[number]
export type GoogleClickParameter = (typeof GOOGLE_CLICK_PARAMETERS)[number]
export type ParameterValues<Name extends string> = { [Key in Name]?: string }

const BUILT_IN_FIELDS = new Map<string, 'utmParams' | 'gclidParams'>([
  ...UTM_PARAMETERS.map((name) => [name, 'utmParams'] as const),
  ...GOOGLE_CLICK_PARAMETERS.map((name) => [name, 'gclidParams'] as const),
])

export const builtInField = (name: string) => BUILT_IN_FIELDS.get(name)

export const isQueryParameterName = (name: unknown): name is string =>
  typeof name === 'string' && name !== '' && name.trim() === name

export const isClickParameterName = (name: unknown): name is string =>
  isQueryParameterName(name) && !builtInField(name)
