import axios from 'axios'

// 定义新闻数据类型
export interface Location {
  location: string
  lat: number
  lng: number
}

export interface Source {
  id?: string
  name: string
}

export interface NewsItem {
  source: Source
  author?: string
  title: string
  description?: string
  url: string
  urlToImage?: string
  publishedAt: string
  content?: string
  location: Location[]
}

// API基础URL
const API_BASE_URL = 'http://localhost:8000/news/test'

// 加载测试数据的函数
export async function loadTestData(category: string = 'general'): Promise<NewsItem[]> {
  try {
    const response = await axios.get(`${API_BASE_URL}/category/${category}`)
    return response.data
  } catch (error) {
    console.error('加载测试数据失败:', error)
    return []
  }
}

// 获取可用类别的函数
export async function getAvailableCategories(): Promise<string[]> {
  try {
    const response = await axios.get(`${API_BASE_URL}/categories`)
    return response.data
  } catch (error) {
    console.error('获取类别列表失败:', error)
    return []
  }
}