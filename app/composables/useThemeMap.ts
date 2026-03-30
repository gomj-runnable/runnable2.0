import type { BaseNode, PoiData, ThemeMap } from '#shared/types/theme-map'

export const useThemeMap = () => {
  const themeMap = useState<ThemeMap | null>('map:themeMap', () => null)

  function setThemeMap(data: ThemeMap) {
    themeMap.value = data
  }

  function findNodeById(nodes: BaseNode[], id: string): BaseNode | null {
    for (const node of nodes) {
      if (node.id === id) return node
      const found = findNodeById(node.children ?? [], id)
      if (found) return found
    }
    return null
  }

  function flattenNodes(nodes: BaseNode[]): PoiData[] {
    const result: PoiData[] = []
    function traverse(node: BaseNode) {
      const [lon, lat, height] = node.position ?? [-1, -1, -1]
      if (lon !== -1 && lat !== -1 && height !== -1) {
        result.push({ poi_id: node.id, name: node.name, lon, lat, height })
      }
      node.children?.forEach(traverse)
    }
    nodes.forEach(traverse)
    return result
  }

  return { themeMap, setThemeMap, findNodeById, flattenNodes }
}