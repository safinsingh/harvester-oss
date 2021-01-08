const PROD = process.env.NODE_ENV === 'production'

export const ME = 'REDACTED'
export const SERVER = PROD ? 'REDACTED' : 'REDACTED'
export const CHANNEL = PROD ? 'REDACTED' : 'REDACTED'
export const ACTIVE_USERS = PROD ? ['REDACTED'] : ['REDACTED']
export const ACTIVE_USER_NAMED = (user: string) =>
	(PROD ? ['REDACTED'] : ['REDACTED'])[ACTIVE_USERS.indexOf(user)]
export const MAPLE_ID = PROD ? 'REDACTED' : 'REDACTED'
export const NEXT_HARVEST_REGEX = PROD
	? /.*'s next harvest is in ([0-9]+)m, ([0-9]+)s/
	: /([0-9]+) ([0-9]+)/
export const INT_RADIX = 10
export const CLOCK_REGEX = PROD
	? /Current harvest time is ([0-9]+) seconds\./
	: /([0-9]+)/
export const HARVEST_TIMEOUT = 1800
export const NORMAL_HARVEST_THRESHOLD = 1200
export const TYPING_HARVEST_THRESHOLD = 1000
export const MAPLE_TIMEOUT = PROD ? 1500 : 10000
export const HARVESTED_REGEX = /You gained ([0-9]+) points/
