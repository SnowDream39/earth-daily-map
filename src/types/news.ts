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

export interface ExportMapResponse {
  success: boolean;
  image_base64?: string | null;
  message: string;
  geojson?: GeoJSON.FeatureCollection | null;
}
//存在冲突，先临时定义一下
export declare namespace GeoJSON {
  export interface FeatureCollection {
    type: "FeatureCollection";
    features: Feature[];
  }

  export interface Feature {
    type: "Feature";
    geometry: Geometry;
    properties: { [key: string]: any };
  }

  export type Geometry = {
    type: "Point";
    coordinates: [number, number];
  };
}