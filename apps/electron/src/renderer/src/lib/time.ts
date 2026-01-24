/**
 * Time and date utility functions for formatting and normalizing dates
 */

/**
 * Format ISO datetime string to YYYY-MM-DD for date input
 * @param value ISO 8601 datetime string
 * @returns YYYY-MM-DD formatted string or empty string if invalid
 */
export function formatDateInput(value?: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

/**
 * Format ISO datetime string to YYYY-MM-DDTHH:mm for datetime-local input
 * @param value ISO 8601 datetime string
 * @returns YYYY-MM-DDTHH:mm formatted string or empty string if invalid
 */
export function formatDateTimeInput(value?: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  // Format as YYYY-MM-DDTHH:mm for datetime-local input
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

/**
 * Format ISO datetime string to localized date and time display
 * @param value ISO 8601 datetime string
 * @returns Formatted string like "Mon, Jan 15, 2:30 PM" or original value if invalid
 */
export function formatDateTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Normalize date input (YYYY-MM-DD) to ISO 8601 datetime string at UTC midnight
 * @param value Date string in YYYY-MM-DD format
 * @returns ISO 8601 datetime string or undefined if invalid
 */
export function normalizeDueDate(value?: string | null): string | undefined {
  if (!value) return undefined
  const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/
  if (isoDatePattern.test(value)) {
    const [year, month, day] = value.split('-')
    const utcDate = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))
    return utcDate.toISOString()
  }
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return undefined
  return parsed.toISOString()
}

/**
 * Normalize datetime-local input to ISO 8601 datetime string
 * @param value Datetime string from datetime-local input
 * @returns ISO 8601 datetime string or undefined if invalid
 */
export function normalizeDateTime(value?: string | null): string | undefined {
  if (!value) return undefined
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return undefined
  return parsed.toISOString()
}

/**
 * Get today's date range in user's timezone
 * @returns Object with startAt (start of today) and endAt (start of tomorrow) as ISO strings
 */
export function getTodayRange(): { startAt: string; endAt: string } {
  const now = new Date()
  // Start of today in local timezone
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  // Start of tomorrow in local timezone
  const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)

  return {
    startAt: startOfToday.toISOString(),
    endAt: startOfTomorrow.toISOString()
  }
}

/**
 * Format a time range in a short, compact format
 * @param startAt Start time as ISO string
 * @param endAt End time as ISO string
 * @returns Formatted string like "Jan 15, 2:30-3:30 PM" or "Jan 15 2:30 PM - Jan 16 3:30 PM"
 */
export function formatTimeRangeShort(startAt?: string | null, endAt?: string | null): string {
  if (!startAt) return 'No schedule'

  const start = new Date(startAt)
  if (Number.isNaN(start.getTime())) return 'Invalid date'

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const formatDateShort = (date: Date): string => {
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric'
    })
  }

  if (!endAt) {
    return `${formatDateShort(start)} ${formatTime(start)}`
  }

  const end = new Date(endAt)
  if (Number.isNaN(end.getTime())) {
    return `${formatDateShort(start)} ${formatTime(start)}`
  }

  // Check if same day
  const sameDay = start.toDateString() === end.toDateString()

  if (sameDay) {
    return `${formatDateShort(start)} ${formatTime(start)}-${formatTime(end)}`
  } else {
    return `${formatDateShort(start)} ${formatTime(start)} - ${formatDateShort(end)} ${formatTime(end)}`
  }
}
