// 将转义的字符修改回原始表达
export const unescapeString = (str: string): string => {
  return str
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\r/g, '\r')
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\')
}

// 生成指定长度的随机字符串
export const generateRandomString = (length: number): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length)
    result += characters[randomIndex]
  }
  return result
}

// 判断链接是否为图片
export const isImage = (url: string): boolean => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'svg', 'gif', 'webp', 'bmp', 'ico']
  try {
    const cleanUrl = url.split(/[?#]/)[0] ?? ''
    const filename = cleanUrl.split('/').pop()
    const ext = filename?.split('.').pop()?.toLowerCase() || ''
    return Boolean(filename?.includes('.') && imageExtensions.includes(ext))
  } catch {
    return false
  }
}

// 判断链接是否为文档文件
export const isFile = (url: string): boolean => {
  const fileExtensions = [
    'xlsx',
    'xls',
    'pdf',
    'md',
    'markdown',
    'htm',
    'html',
    'csv',
    'ppt',
    'pptx',
    'xml',
    'txt',
    'doc',
    'docx',
  ]
  try {
    const cleanUrl = url.split(/[?#]/)[0] ?? ''
    const filename = cleanUrl.split('/').pop()
    const ext = filename?.split('.').pop()?.toLowerCase() || ''
    return Boolean(filename?.includes('.') && fileExtensions.includes(ext))
  } catch {
    return false
  }
}

// 以下为工作流图相关工具函数（依赖 @vue-flow/core 类型）
import type { GraphEdge, GraphNode } from '@vue-flow/core'

// 构建邻接表，key 为节点 id，值为该节点的所有直接子节点(后继节点)
export const buildAdjList = (edges: GraphEdge[]): Map<string, string[]> => {
  const adjList = new Map<string, string[]>()
  edges.forEach((edge) => {
    if (!adjList.has(edge.source)) {
      adjList.set(edge.source, [])
    }
    adjList.get(edge.source)?.push(edge.target)
  })
  return adjList
}

// 构建逆邻接表，key 为节点 id，值为该节点的直接父节点
export const buildReverseAdjList = (edges: GraphEdge[]): Map<string, string[]> => {
  const reverseAdjList = new Map<string, string[]>()
  edges.forEach((edge) => {
    if (!reverseAdjList.has(edge.target)) {
      reverseAdjList.set(edge.target, [])
    }
    reverseAdjList.get(edge.target)?.push(edge.source)
  })
  return reverseAdjList
}

// 根据逆邻接表 + 目标节点 id，获取该节点的所有前置节点
export const getPredecessorsByNodeId = (
  reverseAdjList: Map<string, string[]>,
  targetNodeId: string
): string[] => {
  const visited = new Set<string>()
  const predecessors: string[] = []
  const dfs = (nodeId: string): void => {
    if (!visited.has(nodeId)) {
      visited.add(nodeId)
      if (nodeId !== targetNodeId) predecessors.push(nodeId)
      const neighbors = reverseAdjList.get(nodeId) || []
      neighbors.forEach((neighbor) => {
        dfs(neighbor)
      })
    }
  }
  dfs(targetNodeId)
  return predecessors
}

// 根据节点、边与目标节点 id，获取该节点可引用的所有变量信息
export const getReferencedVariables = (
  nodes: GraphNode[],
  edges: GraphEdge[],
  target_node_id: string
): Record<string, any>[] => {
  const reverseAdjList = buildReverseAdjList(edges)
  const predecessors = getPredecessorsByNodeId(reverseAdjList, target_node_id)
  const predecessorNodes = nodes.filter((node) => predecessors.includes(node.id))
  const options: Record<string, any>[] = []
  predecessorNodes.forEach((node) => {
    const node_variables = {
      isGroup: true,
      label: node.data.title,
      options: [] as any[],
    }
    if (node.type === 'start') {
      node.data?.inputs.forEach((variable: any) => {
        node_variables.options.push({ label: variable.name, value: `${node.id}/${variable.name}` })
      })
    } else {
      node.data?.outputs.forEach((variable: any) => {
        node_variables.options.push({
          label: `${variable.name}`,
          value: `${node.id}/${variable.name}`,
        })
      })
    }
    options.push(node_variables)
  })
  return options
}
