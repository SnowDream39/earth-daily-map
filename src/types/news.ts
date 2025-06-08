//新闻相关接口定义
export interface LocationItem {
  location?: string;//虽然都有，但后面不需要
  lat: number;
  lng: number;
}

export interface Source {
  id: string | null;
  name: string;
}

export interface Article {
  id: number;
  source: Source;
  author: string;
  title: string;
  description: string;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string | null;
  location: LocationItem[];//一条新闻可能对应多个
}

export interface CityData {
  name: string;
  code?: string;
  centerPoint: string; // "经度,纬度" 格式
  province?: string;
  pinyin?: string;
  level?: number;
}
