/**
 * 时间和期数的计算真的挺复杂的。
 * API返回的日期是刊物的开始时间。
 */

import { DateTime } from 'luxon'

/**
 *
 * @param dateStr ISO 8601 格式 UTC
 * @returns
 */
export function formatTime(dateStr: string) {
  // 假设 dateStr 是 UTC 时间格式，例如 "2025-06-25 10:14:00"
  const d = DateTime.fromISO(dateStr, { zone: 'utc' }) // 解析为 UTC 时间
  const local = d.setZone(DateTime.local().zoneName) // 转换为本地时间
  return local.toFormat('yyyy-MM-dd HH:mm:ss')
}
