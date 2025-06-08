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