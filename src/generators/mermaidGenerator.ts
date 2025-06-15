import {
  DependencyGraph,
  ComponentNode,
  DependencyEdge,
  CircularDependency,
} from '../types/dependency.js';
import {
  MermaidDiagram,
  MermaidNode,
  MermaidEdge,
  MermaidDiagramConfig,
  MermaidGeneratorOptions,
  MermaidOutput,
  MermaidNodeStyle,
} from '../types/mermaid.js';
import path from 'path';

export class MermaidGenerator {
  private defaultConfig: MermaidDiagramConfig = {
    direction: 'TD',
    theme: 'default',
    fontSize: 12,
    showCircularDependencies: true,
    showDependencyTypes: true,
    maxDepth: undefined,
  };

  private nodeStyleMap: Record<string, MermaidNodeStyle> = {
    vue: { fill: '#42b883', stroke: '#369870', color: '#ffffff' },
    js: { fill: '#f7df1e', stroke: '#d4c017', color: '#000000' },
    ts: { fill: '#3178c6', stroke: '#235a97', color: '#ffffff' },
    jsx: { fill: '#61dafb', stroke: '#21b6ce', color: '#000000' },
    tsx: { fill: '#61dafb', stroke: '#21b6ce', color: '#ffffff' },
    circular: { fill: '#ff6b6b', stroke: '#ee5a52', color: '#ffffff' },
  };

  generateDiagram(
    dependencyGraph: DependencyGraph,
    options: Partial<MermaidGeneratorOptions> = {}
  ): MermaidOutput {
    const config = { ...this.defaultConfig };

    // Use Left-to-Right direction for better readability
    if (dependencyGraph.nodes.size > 4) {
      config.direction = 'LR';
    }

    const nodes = this.createMermaidNodes(dependencyGraph);
    const edges = this.createMermaidEdges(dependencyGraph);

    const diagram: MermaidDiagram = {
      config,
      nodes,
      edges,
      title: 'Component Dependency Graph',
    };

    const mermaidContent = this.generateMermaidSyntax(diagram, options);

    return {
      format: options.outputFormat || 'mermaid',
      content: mermaidContent,
      metadata: {
        nodeCount: nodes.length,
        edgeCount: edges.length,
        circularDependencies: dependencyGraph.circularDependencies.length,
        generatedAt: new Date(),
      },
    };
  }

  private createMermaidNodes(dependencyGraph: DependencyGraph): MermaidNode[] {
    const circularFiles = this.getCircularDependencyFiles(
      dependencyGraph.circularDependencies
    );

    return Array.from(dependencyGraph.nodes.values()).map(
      (node: ComponentNode) => {
        const fileExt = path
          .extname(node.filePath)
          .slice(1) as keyof typeof this.nodeStyleMap;
        const isCircular = circularFiles.has(node.filePath);

        return {
          id: this.sanitizeNodeId(node.filePath),
          label: this.createNodeLabel(node),
          type: this.getNodeType(node.filePath),
          style: isCircular
            ? this.nodeStyleMap.circular
            : this.nodeStyleMap[fileExt] || this.nodeStyleMap.js,
          isCircular,
        };
      }
    );
  }

  private createMermaidEdges(dependencyGraph: DependencyGraph): MermaidEdge[] {
    // Remove duplicate edges by creating a unique key
    const edgeMap = new Map<string, MermaidEdge>();

    dependencyGraph.edges.forEach((edge) => {
      const fromId = this.sanitizeNodeId(edge.from);
      const toId = this.sanitizeNodeId(edge.to);
      const edgeKey = `${fromId}->${toId}-${edge.type}`;

      if (!edgeMap.has(edgeKey)) {
        edgeMap.set(edgeKey, {
          from: fromId,
          to: toId,
          type: edge.type,
          style:
            edge.type === 'component-usage'
              ? { stroke: '#ff6b6b', strokeWidth: 2, strokeDasharray: '5,5' }
              : { stroke: '#666666', strokeWidth: 1 },
        });
      }
    });

    return Array.from(edgeMap.values());
  }

  private generateMermaidSyntax(
    diagram: MermaidDiagram,
    options: Partial<MermaidGeneratorOptions>
  ): string {
    const lines: string[] = [];

    // Add diagram type and direction
    lines.push(`graph ${diagram.config.direction}`);

    // Add title if present
    if (diagram.title) {
      lines.push(`  %% ${diagram.title}`);
      lines.push('');
    }

    // Group nodes by directory if enabled
    if (options.groupByDirectory) {
      const groups = this.groupNodesByDirectory(diagram.nodes);

      Object.entries(groups).forEach(([dir, nodes]) => {
        lines.push(
          `  subgraph ${dir.replace(/[^a-zA-Z0-9]/g, '_')}_group ["${dir}"]`
        );
        nodes.forEach((node) => {
          const shape = this.getNodeShape(node);
          lines.push(`    ${node.id}${shape}`);
        });
        lines.push('  end');
        lines.push('');
      });
    } else {
      // Add nodes with labels and styles
      diagram.nodes.forEach((node) => {
        const shape = this.getNodeShape(node);
        lines.push(`  ${node.id}${shape}`);
      });
    }

    lines.push('');

    // Add edges
    diagram.edges.forEach((edge) => {
      const arrow = this.getEdgeArrow(edge);
      // Simplified labels without verbose type names
      const label = edge.type === 'component-usage' ? '' : '';
      lines.push(`  ${edge.from} ${arrow}${label} ${edge.to}`);
    });

    // Add styles if enabled
    if (options.includeStyles !== false) {
      lines.push('');
      lines.push('  %% Styles');
      diagram.nodes.forEach((node) => {
        if (node.style) {
          const styleStr = this.createStyleString(node.style);
          lines.push(`  classDef ${node.id}Style ${styleStr}`);
          lines.push(`  class ${node.id} ${node.id}Style`);
        }
      });
    }

    return lines.join('\n');
  }

  private groupNodesByDirectory(
    nodes: MermaidNode[]
  ): Record<string, MermaidNode[]> {
    const groups: Record<string, MermaidNode[]> = {};

    nodes.forEach((node) => {
      const dir = node.label.includes('/') ? node.label.split('/')[0] : 'root';

      if (!groups[dir]) {
        groups[dir] = [];
      }
      groups[dir].push(node);
    });

    return groups;
  }

  private sanitizeNodeId(id: string): string {
    // Use relative path instead of full path for cleaner IDs
    const relativePath = id.includes('/src/')
      ? id.split('/src/')[1]
      : path.basename(id);
    return relativePath.replace(/[^a-zA-Z0-9_]/g, '_').replace(/_{2,}/g, '_');
  }

  private createNodeLabel(node: ComponentNode): string {
    // Show relative path from src/ for better context
    if (node.filePath.includes('/src/')) {
      return node.filePath.split('/src/')[1];
    }
    return path.basename(node.filePath);
  }

  private getNodeType(filePath: string): 'vue' | 'js' | 'ts' | 'jsx' | 'tsx' {
    const ext = path.extname(filePath).slice(1);
    return ext as 'vue' | 'js' | 'ts' | 'jsx' | 'tsx';
  }

  private getNodeShape(node: MermaidNode): string {
    const label = node.label;
    if (node.isCircular) {
      return `["🔄 ${label}"]`;
    }

    switch (node.type) {
      case 'vue':
        return `["📄 ${label}"]`;
      case 'tsx':
      case 'jsx':
        return `("⚛️ ${label}")`;
      case 'ts':
        return `["📘 ${label}"]`;
      case 'js':
        return `["📜 ${label}"]`;
      default:
        return `["${label}"]`;
    }
  }

  private getEdgeArrow(edge: MermaidEdge): string {
    switch (edge.type) {
      case 'component-usage':
        return '-..->';
      case 'dynamic-import':
        return '==>';
      case 'require':
        return '-->';
      case 'import':
      default:
        return '-->';
    }
  }

  private createStyleString(style: MermaidNodeStyle): string {
    const parts: string[] = [];
    if (style.fill) parts.push(`fill:${style.fill}`);
    if (style.stroke) parts.push(`stroke:${style.stroke}`);
    if (style.strokeWidth) parts.push(`stroke-width:${style.strokeWidth}px`);
    if (style.color) parts.push(`color:${style.color}`);
    return parts.join(',');
  }

  private getCircularDependencyFiles(
    circularDeps: CircularDependency[]
  ): Set<string> {
    const files = new Set<string>();
    circularDeps.forEach((cycle) => {
      cycle.cycle.forEach((nodeId) => {
        files.add(nodeId);
      });
    });
    return files;
  }
}
