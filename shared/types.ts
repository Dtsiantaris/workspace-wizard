export interface Workspace {
  id: string
  name: string
  description?: string
  icon?: string
  color?: string
  processes: ProcessConfig[]
}

export interface ProcessConfig {
  id: string
  PID: string
  name: string
  path: string
}
