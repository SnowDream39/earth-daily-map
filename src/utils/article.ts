import type { Article } from '@/types/news'

export async function loadNewsData(
  category?: string,
  startTime?: string,
  endTime?: string,
): Promise<Article[]> {
  const params = new URLSearchParams()
  if (category) params.append('category', category)
  if (startTime) params.append('start_time', startTime)
  if (endTime) params.append('end_time', endTime)

  const response = await fetch(
    `http://8.209.210.116:7000/news/locations/articles/with-location?${params.toString()}`,
  )
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.detail || '请求失败')
  }

  const data = await response.json()

  //data.articles已经是 Article 类型结构，直接返回即可
  return data.articles as Article[]
}
