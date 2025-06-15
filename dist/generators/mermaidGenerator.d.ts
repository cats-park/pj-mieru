import { DependencyGraph } from '../types/dependency.js';
import { MermaidGeneratorOptions, MermaidOutput } from '../types/mermaid.js';
export declare class MermaidGenerator {
    private defaultConfig;
    private nodeStyleMap;
    generateDiagram(dependencyGraph: DependencyGraph, options?: Partial<MermaidGeneratorOptions>): MermaidOutput;
    private createMermaidNodes;
    private createMermaidEdges;
    private generateMermaidSyntax;
    private groupNodesByDirectory;
    private sanitizeNodeId;
    private createNodeLabel;
    private getNodeType;
    private getNodeShape;
    private getEdgeArrow;
    private createStyleString;
    private getCircularDependencyFiles;
}
//# sourceMappingURL=mermaidGenerator.d.ts.map