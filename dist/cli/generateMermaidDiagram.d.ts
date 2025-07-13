interface ComponentInfo {
    name: string;
    type: string;
    filePath?: string;
    children: ComponentInfo[];
}
interface PageInfo {
    name: string;
    filePath: string;
    route: string;
    components: ComponentInfo[];
}
export declare function createMermaidDiagram(pages: PageInfo[]): string;
export {};
//# sourceMappingURL=generateMermaidDiagram.d.ts.map