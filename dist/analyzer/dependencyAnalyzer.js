import * as fs from 'fs';
import * as path from 'path';
/**
 * コンポーネント依存関係解析クラス
 */
export class DependencyAnalyzer {
    options;
    constructor(options = {}) {
        this.options = {
            maxDepth: 10,
            detectCircular: true,
            includeDynamicImports: true,
            excludeNodeModules: true,
            excludePatterns: ['node_modules/**', 'dist/**', 'build/**'],
            minFileSize: 0,
            maxFileSize: 10 * 1024 * 1024, // 10MB
            ...options,
        };
    }
    /**
     * スキャン結果とAST解析結果から依存関係グラフを構築
     */
    async analyze(scanResult, astResults, vueResults = []) {
        const startTime = Date.now();
        // ノードマップを構築
        const nodes = await this.buildNodes(scanResult, astResults, vueResults);
        // エッジを構築
        const edges = this.buildEdges(astResults, vueResults, nodes);
        // 循環依存を検出
        const circularDependencies = this.options.detectCircular
            ? this.detectCircularDependencies(edges, nodes)
            : [];
        // 統計を計算
        const stats = this.calculateStats(nodes, edges, circularDependencies, Date.now() - startTime);
        return {
            nodes,
            edges,
            circularDependencies,
            stats,
        };
    }
    /**
     * ノードマップを構築
     */
    async buildNodes(scanResult, astResults, vueResults) {
        const nodes = new Map();
        // AST解析結果からノードを作成
        for (const astResult of astResults) {
            const fileInfo = scanResult.files.find((f) => f.path === astResult.filePath);
            if (!fileInfo)
                continue;
            const node = await this.createComponentNodeFromAst(astResult, fileInfo);
            if (node) {
                nodes.set(node.filePath, node);
            }
        }
        // Vue SFC解析結果からノードを作成
        for (const vueResult of vueResults) {
            const fileInfo = scanResult.files.find((f) => f.path === vueResult.filePath);
            if (!fileInfo)
                continue;
            const node = await this.createComponentNodeFromVue(vueResult, fileInfo);
            if (node) {
                nodes.set(node.filePath, node);
            }
        }
        return nodes;
    }
    /**
     * AST解析結果からコンポーネントノードを作成
     */
    async createComponentNodeFromAst(astResult, fileInfo) {
        try {
            const stats = fs.statSync(astResult.filePath);
            const content = fs.readFileSync(astResult.filePath, 'utf-8');
            const lineCount = content.split('\n').length;
            // エクスポートタイプを決定
            const hasDefault = astResult.exports.some((e) => e.type === 'default');
            const hasNamed = astResult.exports.some((e) => e.type === 'named');
            const exportType = hasDefault && hasNamed
                ? 'both'
                : hasDefault
                    ? 'default'
                    : hasNamed
                        ? 'named'
                        : 'none';
            // コンポーネント名を抽出
            const name = this.extractComponentName(astResult.filePath, astResult);
            return {
                filePath: astResult.filePath,
                relativePath: astResult.relativePath,
                name,
                type: this.getFileType(astResult.filePath),
                size: stats.size,
                lastModified: stats.mtime,
                exportType,
                definitionCount: astResult.definitions.length,
                lineCount,
            };
        }
        catch (error) {
            console.warn(`Failed to create node for ${astResult.filePath}:`, error);
            return null;
        }
    }
    /**
     * Vue SFC解析結果からコンポーネントノードを作成
     */
    async createComponentNodeFromVue(vueResult, fileInfo) {
        try {
            const stats = fs.statSync(vueResult.filePath);
            const content = fs.readFileSync(vueResult.filePath, 'utf-8');
            const lineCount = content.split('\n').length;
            // エクスポートタイプを決定
            const hasDefault = vueResult.exports.some((e) => e.type === 'default');
            const hasNamed = vueResult.exports.some((e) => e.type === 'named');
            const exportType = hasDefault && hasNamed
                ? 'both'
                : hasDefault
                    ? 'default'
                    : hasNamed
                        ? 'named'
                        : 'none';
            // Vueコンポーネント名を抽出
            const name = this.extractVueComponentName(vueResult.filePath);
            return {
                filePath: vueResult.filePath,
                relativePath: path.relative(process.cwd(), vueResult.filePath),
                name,
                type: 'vue',
                size: stats.size,
                lastModified: stats.mtime,
                exportType,
                definitionCount: vueResult.definitions.length,
                lineCount,
            };
        }
        catch (error) {
            console.warn(`Failed to create node for ${vueResult.filePath}:`, error);
            return null;
        }
    }
    /**
     * エッジを構築
     */
    buildEdges(astResults, vueResults, nodes) {
        const edges = [];
        // AST解析結果からエッジを作成
        for (const astResult of astResults) {
            edges.push(...this.createEdgesFromAst(astResult, nodes));
        }
        // Vue SFC解析結果からエッジを作成
        for (const vueResult of vueResults) {
            edges.push(...this.createEdgesFromVue(vueResult, nodes));
        }
        return edges;
    }
    /**
     * AST解析結果からエッジを作成
     */
    createEdgesFromAst(astResult, nodes) {
        const edges = [];
        // インポートからエッジを作成
        for (const importInfo of astResult.imports) {
            const targetPath = this.resolveImportPath(astResult.filePath, importInfo.source);
            if (targetPath && nodes.has(targetPath)) {
                edges.push({
                    from: astResult.filePath,
                    to: targetPath,
                    type: 'import',
                    importName: importInfo.name,
                    line: importInfo.line,
                    weight: 1,
                    props: [],
                });
            }
        }
        // コンポーネント使用からエッジを作成
        for (const usage of astResult.componentUsages) {
            // 使用されているコンポーネントの対応するインポートを見つける
            const relatedImport = astResult.imports.find((imp) => imp.name === usage.name ||
                (imp.type === 'default' &&
                    this.getComponentNameFromPath(imp.source) === usage.name));
            if (relatedImport) {
                const targetPath = this.resolveImportPath(astResult.filePath, relatedImport.source);
                if (targetPath && nodes.has(targetPath)) {
                    // 既存のエッジがあるかチェック
                    const existingEdge = edges.find((e) => e.from === astResult.filePath &&
                        e.to === targetPath &&
                        e.type === 'component-usage');
                    if (existingEdge) {
                        existingEdge.weight++;
                        existingEdge.props = [
                            ...new Set([...(existingEdge.props || []), ...usage.props]),
                        ];
                    }
                    else {
                        edges.push({
                            from: astResult.filePath,
                            to: targetPath,
                            type: 'component-usage',
                            importName: usage.name,
                            line: usage.line,
                            weight: 1,
                            props: usage.props,
                        });
                    }
                }
            }
        }
        return edges;
    }
    /**
     * Vue SFC解析結果からエッジを作成
     */
    createEdgesFromVue(vueResult, nodes) {
        const edges = [];
        // インポートからエッジを作成
        for (const importInfo of vueResult.imports) {
            const targetPath = this.resolveImportPath(vueResult.filePath, importInfo.source);
            if (targetPath && nodes.has(targetPath)) {
                edges.push({
                    from: vueResult.filePath,
                    to: targetPath,
                    type: 'import',
                    importName: importInfo.name,
                    line: importInfo.line,
                    weight: 1,
                    props: [],
                });
            }
        }
        // コンポーネント使用からエッジを作成
        for (const usage of vueResult.componentUsages) {
            const relatedImport = vueResult.imports.find((imp) => imp.name === usage.name ||
                (imp.type === 'default' &&
                    this.getComponentNameFromPath(imp.source) === usage.name));
            if (relatedImport) {
                const targetPath = this.resolveImportPath(vueResult.filePath, relatedImport.source);
                if (targetPath && nodes.has(targetPath)) {
                    const existingEdge = edges.find((e) => e.from === vueResult.filePath &&
                        e.to === targetPath &&
                        e.type === 'component-usage');
                    if (existingEdge) {
                        existingEdge.weight++;
                        existingEdge.props = [
                            ...new Set([...(existingEdge.props || []), ...usage.props]),
                        ];
                    }
                    else {
                        edges.push({
                            from: vueResult.filePath,
                            to: targetPath,
                            type: 'component-usage',
                            importName: usage.name,
                            line: usage.line,
                            weight: 1,
                            props: usage.props,
                        });
                    }
                }
            }
        }
        return edges;
    }
    /**
     * 循環依存を検出
     */
    detectCircularDependencies(edges, nodes) {
        const visited = new Set();
        const recursionStack = new Set();
        const circularDependencies = [];
        // 隣接リストを構築
        const adjacencyList = new Map();
        for (const edge of edges) {
            if (!adjacencyList.has(edge.from)) {
                adjacencyList.set(edge.from, []);
            }
            adjacencyList.get(edge.from).push(edge.to);
        }
        // DFSで循環依存を検出
        const dfs = (node, path) => {
            visited.add(node);
            recursionStack.add(node);
            path.push(node);
            const neighbors = adjacencyList.get(node) || [];
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    dfs(neighbor, [...path]);
                }
                else if (recursionStack.has(neighbor)) {
                    // 循環依存を発見
                    const cycleStart = path.indexOf(neighbor);
                    const cycle = path.slice(cycleStart);
                    cycle.push(neighbor); // 循環を閉じる
                    const cycleEdges = this.getCycleEdges(cycle, edges);
                    circularDependencies.push({
                        cycle,
                        depth: cycle.length - 1,
                        edges: cycleEdges,
                    });
                }
            }
            recursionStack.delete(node);
        };
        // すべてのノードから開始
        for (const nodeKey of nodes.keys()) {
            if (!visited.has(nodeKey)) {
                dfs(nodeKey, []);
            }
        }
        // 重複除去
        return this.deduplicateCircularDependencies(circularDependencies);
    }
    /**
     * ファイルタイプを取得
     */
    getFileType(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        switch (ext) {
            case '.vue':
                return 'vue';
            case '.jsx':
            case '.tsx':
                return 'react';
            case '.ts':
                return 'ts';
            case '.js':
                return 'js';
            case '.svelte':
                return 'svelte';
            default:
                return 'js';
        }
    }
    /**
     * コンポーネント名を抽出
     */
    extractComponentName(filePath, astResult) {
        // デフォルトエクスポートの名前を優先
        if (astResult) {
            const defaultExport = astResult.definitions.find((def) => def.exported && def.exportType === 'default');
            if (defaultExport) {
                return defaultExport.name;
            }
        }
        // ファイル名から推測
        return this.getComponentNameFromPath(filePath);
    }
    /**
     * Vueコンポーネント名を抽出
     */
    extractVueComponentName(filePath) {
        return this.getComponentNameFromPath(filePath);
    }
    /**
     * パスからコンポーネント名を取得
     */
    getComponentNameFromPath(filePath) {
        const basename = path.basename(filePath, path.extname(filePath));
        // PascalCaseに変換
        return basename
            .split(/[-_]/)
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
            .join('');
    }
    /**
     * インポートパスを解決
     */
    resolveImportPath(fromPath, importSource) {
        if (importSource.startsWith('.')) {
            // 相対パス
            const dir = path.dirname(fromPath);
            let resolved = path.resolve(dir, importSource);
            // パスが既に拡張子を持っている場合
            if (path.extname(resolved)) {
                if (fs.existsSync(resolved)) {
                    return resolved;
                }
                return null;
            }
            // 拡張子を補完して試す
            const extensions = ['.vue', '.ts', '.tsx', '.js', '.jsx'];
            for (const ext of extensions) {
                const withExt = resolved + ext;
                if (fs.existsSync(withExt)) {
                    return withExt;
                }
            }
            // ディレクトリの場合、index.* ファイルをチェック
            if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
                for (const ext of extensions) {
                    const indexFile = path.join(resolved, `index${ext}`);
                    if (fs.existsSync(indexFile)) {
                        return indexFile;
                    }
                }
            }
        }
        return null;
    }
    /**
     * 循環のエッジを取得
     */
    getCycleEdges(cycle, edges) {
        const cycleEdges = [];
        for (let i = 0; i < cycle.length - 1; i++) {
            const from = cycle[i];
            const to = cycle[i + 1];
            const edge = edges.find((e) => e.from === from && e.to === to);
            if (edge) {
                cycleEdges.push(edge);
            }
        }
        return cycleEdges;
    }
    /**
     * 循環依存の重複を除去
     */
    deduplicateCircularDependencies(circularDependencies) {
        const unique = [];
        const seen = new Set();
        for (const circular of circularDependencies) {
            const normalized = [...circular.cycle].sort().join('->');
            if (!seen.has(normalized)) {
                seen.add(normalized);
                unique.push(circular);
            }
        }
        return unique;
    }
    /**
     * 統計を計算
     */
    calculateStats(nodes, edges, circularDependencies, analysisTime) {
        // 孤立したノード数を計算
        const connectedNodes = new Set();
        edges.forEach((edge) => {
            connectedNodes.add(edge.from);
            connectedNodes.add(edge.to);
        });
        const isolatedNodes = nodes.size - connectedNodes.size;
        // 最大依存深度を計算
        const maxDepth = this.calculateMaxDepth(edges, nodes);
        return {
            totalNodes: nodes.size,
            totalEdges: edges.length,
            circularCount: circularDependencies.length,
            isolatedNodes,
            maxDepth,
            analysisTime,
        };
    }
    /**
     * 最大依存深度を計算
     */
    calculateMaxDepth(edges, nodes) {
        const inDegree = new Map();
        const adjacencyList = new Map();
        // グラフを構築
        for (const nodeKey of nodes.keys()) {
            inDegree.set(nodeKey, 0);
            adjacencyList.set(nodeKey, []);
        }
        for (const edge of edges) {
            adjacencyList.get(edge.from).push(edge.to);
            inDegree.set(edge.to, (inDegree.get(edge.to) || 0) + 1);
        }
        // トポロジカルソートで最長パスを計算
        const queue = [];
        const distance = new Map();
        for (const [nodeKey, degree] of inDegree) {
            if (degree === 0) {
                queue.push(nodeKey);
                distance.set(nodeKey, 0);
            }
        }
        let maxDepth = 0;
        while (queue.length > 0) {
            const current = queue.shift();
            const currentDistance = distance.get(current) || 0;
            for (const neighbor of adjacencyList.get(current) || []) {
                const newDistance = currentDistance + 1;
                const currentNeighborDistance = distance.get(neighbor) || 0;
                if (newDistance > currentNeighborDistance) {
                    distance.set(neighbor, newDistance);
                    maxDepth = Math.max(maxDepth, newDistance);
                }
                inDegree.set(neighbor, (inDegree.get(neighbor) || 0) - 1);
                if (inDegree.get(neighbor) === 0) {
                    queue.push(neighbor);
                }
            }
        }
        return maxDepth;
    }
}
//# sourceMappingURL=dependencyAnalyzer.js.map