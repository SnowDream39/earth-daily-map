// 解析坐标的辅助函数
function parseCoordinates(centerPoint: string): { longitude: number; latitude: number } | null {
  try {
    let longitude: number, latitude: number

    if (centerPoint.includes(',')) {
      const parts = centerPoint.split(',').map((s) => s.trim())
      if (parts.length !== 2) return null
      longitude = parseFloat(parts[0])
      latitude = parseFloat(parts[1])
    } else if (centerPoint.includes(' ')) {
      const parts = centerPoint.split(' ').filter((s) => s.trim())
      if (parts.length !== 2) return null
      longitude = parseFloat(parts[0])
      latitude = parseFloat(parts[1])
    } else {
      return null
    }

    if (isNaN(longitude) || isNaN(latitude)) return null
    return { longitude, latitude }
  } catch (error) {
    return null
  }
}

// 验证坐标有效性
function isValidCoordinate(longitude: number, latitude: number): boolean {
  return longitude >= 70 && longitude <= 140 && latitude >= 0 && latitude <= 60
}
