export interface MermaidDiagramConfig {
  direction: 'TD' | 'TB' | 'BT' | 'RL' | 'LR';
  theme?: string;
  fontSize?: number;
  showCircularDependencies?: boolean;
  showDependencyTypes?: boolean;
  maxDepth?: number;
}

export interface MermaidNodeStyle {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  color?: string;
}

export interface MermaidNode {
  id: string;
  label: string;
  type: 'vue' | 'js' | 'ts' | 'jsx' | 'tsx';
  style?: MermaidNodeStyle;
  isCircular?: boolean;
}

export interface MermaidEdge {
  from: string;
  to: string;
  type: 'import' | 'component-usage' | 'dynamic-import' | 'require';
  style?: {
    stroke?: string;
    strokeWidth?: number;
    strokeDasharray?: string;
  };
}

export interface MermaidDiagram {
  config: MermaidDiagramConfig;
  nodes: MermaidNode[];
  edges: MermaidEdge[];
  title?: string;
}

export interface MermaidGeneratorOptions {
  outputFormat: 'mermaid' | 'svg' | 'png' | 'html';
  includeStyles?: boolean;
  compactMode?: boolean;
  highlightCircularDependencies?: boolean;
  groupByDirectory?: boolean;
}

export interface MermaidOutput {
  format: string;
  content: string;
  metadata: {
    nodeCount: number;
    edgeCount: number;
    circularDependencies: number;
    generatedAt: Date;
  };
}
