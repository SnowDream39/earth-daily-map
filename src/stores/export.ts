import type { ExportMapResponse} from '@/types/news';

export async function exportMap(requestBody: any): Promise<ExportMapResponse> {
  const response = await fetch('http://localhost:8000/map/export', {  // 修改此行
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });
  
  if (!response.ok) {
    throw new Error('网络错误');
  }

  const data: ExportMapResponse = await response.json();
  return data;
}