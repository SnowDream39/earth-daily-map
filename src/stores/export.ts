import type { Article } from '@/types/news'

interface PointData {
  latitude: number
  longitude: number
  properties?: Record<string, any>
}

export async function preparePointsFromArticles(articles: Article[]): Promise<PointData[]> {
  const points: PointData[] = []

  for (const article of articles) {
    // article.location 是 LocationItem[]，对应多个点
    if (article.location && article.location.length) {
      for (const loc of article.location) {
        points.push({
          latitude: loc.lat,  // 根据你的 LocationItem 字段名调整
          longitude: loc.lng,
          properties: {
            title: article.title,
            author: article.author,
            publishedAt: article.publishedAt,
            url: article.url,
          }
        })
      }
    }
  }

  return points
}