/**
 * コンポーネント関係分析クラス
 */
export class RelationshipAnalyzer {
    /**
     * 依存関係グラフからコンポーネント関係を分析
     */
    analyzeRelationships(graph) {
        const relations = [];
        const nodeKeys = Array.from(graph.nodes.keys());
        // 各ノードペアの関係を分析
        for (let i = 0; i < nodeKeys.length; i++) {
            for (let j = i + 1; j < nodeKeys.length; j++) {
                const nodeA = nodeKeys[i];
                const nodeB = nodeKeys[j];
                // A -> B の関係
                const relationAB = this.analyzeRelationship(nodeA, nodeB, graph);
                if (relationAB.relation !== 'independent') {
                    relations.push(relationAB);
                }
                // B -> A の関係 (非対称の場合のみ)
                const relationBA = this.analyzeRelationship(nodeB, nodeA, graph);
                if (relationBA.relation !== 'independent' &&
                    relationBA.relation !== relationAB.relation) {
                    relations.push(relationBA);
                }
            }
        }
        return relations;
    }
    /**
     * 2つのコンポーネント間の関係を分析
     */
    analyzeRelationship(fromNode, toNode, graph) {
        // 直接的な依存関係をチェック
        const directEdge = graph.edges.find((e) => e.from === fromNode && e.to === toNode);
        if (directEdge) {
            return {
                from: fromNode,
                to: toNode,
                relation: 'parent-child',
                depth: 0,
                path: [fromNode, toNode],
            };
        }
        // 間接的な依存関係をチェック
        const path = this.findPath(fromNode, toNode, graph.edges);
        if (path.length > 0) {
            return {
                from: fromNode,
                to: toNode,
                relation: path.length === 2 ? 'parent-child' : 'ancestor',
                depth: path.length - 1,
                path,
            };
        }
        // 逆方向の依存関係をチェック（子孫関係）
        const reversePath = this.findPath(toNode, fromNode, graph.edges);
        if (reversePath.length > 0) {
            return {
                from: fromNode,
                to: toNode,
                relation: 'descendant',
                depth: reversePath.length - 1,
                path: reversePath.reverse(),
            };
        }
        // 兄弟関係をチェック
        const isSibling = this.areSiblings(fromNode, toNode, graph.edges);
        if (isSibling) {
            return {
                from: fromNode,
                to: toNode,
                relation: 'sibling',
                depth: 0,
            };
        }
        // 関係なし
        return {
            from: fromNode,
            to: toNode,
            relation: 'independent',
            depth: 0,
        };
    }
    /**
     * BFS で最短パスを見つける
     */
    findPath(start, end, edges) {
        if (start === end)
            return [start];
        // 隣接リストを構築
        const adjacencyList = new Map();
        for (const edge of edges) {
            if (!adjacencyList.has(edge.from)) {
                adjacencyList.set(edge.from, []);
            }
            adjacencyList.get(edge.from).push(edge.to);
        }
        const queue = [
            { node: start, path: [start] },
        ];
        const visited = new Set([start]);
        while (queue.length > 0) {
            const { node, path } = queue.shift();
            const neighbors = adjacencyList.get(node) || [];
            for (const neighbor of neighbors) {
                if (neighbor === end) {
                    return [...path, neighbor];
                }
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    queue.push({ node: neighbor, path: [...path, neighbor] });
                }
            }
        }
        return []; // パスが見つからない
    }
    /**
     * 兄弟関係かどうかをチェック
     */
    areSiblings(nodeA, nodeB, edges) {
        // 共通の親を持つかチェック
        const parentsA = this.getParents(nodeA, edges);
        const parentsB = this.getParents(nodeB, edges);
        // 共通の親が存在するかチェック
        for (const parentA of parentsA) {
            if (parentsB.includes(parentA)) {
                return true;
            }
        }
        return false;
    }
    /**
     * ノードの直接的な親を取得
     */
    getParents(node, edges) {
        return edges.filter((edge) => edge.to === node).map((edge) => edge.from);
    }
    /**
     * ノードの直接的な子を取得
     */
    getChildren(node, edges) {
        return edges.filter((edge) => edge.from === node).map((edge) => edge.to);
    }
    /**
     * 依存関係の統計を計算
     */
    calculateRelationshipStats(relations) {
        const stats = {
            parentChild: 0,
            sibling: 0,
            ancestor: 0,
            descendant: 0,
            independent: 0,
            totalRelations: relations.length,
            avgDepth: 0,
            maxDepth: 0,
        };
        let totalDepth = 0;
        for (const relation of relations) {
            switch (relation.relation) {
                case 'parent-child':
                    stats.parentChild++;
                    break;
                case 'sibling':
                    stats.sibling++;
                    break;
                case 'ancestor':
                    stats.ancestor++;
                    break;
                case 'descendant':
                    stats.descendant++;
                    break;
                case 'independent':
                    stats.independent++;
                    break;
            }
            totalDepth += relation.depth;
            stats.maxDepth = Math.max(stats.maxDepth, relation.depth);
        }
        stats.avgDepth = relations.length > 0 ? totalDepth / relations.length : 0;
        return stats;
    }
    /**
     * 最も依存されているコンポーネントを特定
     */
    findMostDependedComponents(graph, limit = 10) {
        const dependencyCount = new Map();
        // 各ノードの被依存数を計算
        for (const nodeKey of graph.nodes.keys()) {
            dependencyCount.set(nodeKey, 0);
        }
        for (const edge of graph.edges) {
            const currentCount = dependencyCount.get(edge.to) || 0;
            dependencyCount.set(edge.to, currentCount + 1);
        }
        // 降順でソートして上位を返す
        return Array.from(dependencyCount.entries())
            .map(([nodeKey, count]) => ({
            node: graph.nodes.get(nodeKey),
            dependencyCount: count,
        }))
            .sort((a, b) => b.dependencyCount - a.dependencyCount)
            .slice(0, limit);
    }
    /**
     * 最も依存しているコンポーネントを特定
     */
    findMostDependingComponents(graph, limit = 10) {
        const dependencyCount = new Map();
        // 各ノードの依存数を計算
        for (const nodeKey of graph.nodes.keys()) {
            dependencyCount.set(nodeKey, 0);
        }
        for (const edge of graph.edges) {
            const currentCount = dependencyCount.get(edge.from) || 0;
            dependencyCount.set(edge.from, currentCount + 1);
        }
        // 降順でソートして上位を返す
        return Array.from(dependencyCount.entries())
            .map(([nodeKey, count]) => ({
            node: graph.nodes.get(nodeKey),
            dependencyCount: count,
        }))
            .sort((a, b) => b.dependencyCount - a.dependencyCount)
            .slice(0, limit);
    }
    /**
     * 依存関係のクラスターを検出
     */
    detectClusters(graph, minClusterSize = 3) {
        const visited = new Set();
        const clusters = [];
        for (const nodeKey of graph.nodes.keys()) {
            if (!visited.has(nodeKey)) {
                const cluster = this.findConnectedComponent(nodeKey, graph.edges, visited);
                if (cluster.length >= minClusterSize) {
                    clusters.push(cluster);
                }
            }
        }
        return clusters;
    }
    /**
     * 連結成分を見つける（無向グラフとして扱う）
     */
    findConnectedComponent(startNode, edges, visited) {
        const component = [];
        const queue = [startNode];
        // 無向グラフとして隣接リストを構築
        const adjacencyList = new Map();
        for (const edge of edges) {
            // 双方向エッジとして追加
            if (!adjacencyList.has(edge.from)) {
                adjacencyList.set(edge.from, []);
            }
            if (!adjacencyList.has(edge.to)) {
                adjacencyList.set(edge.to, []);
            }
            adjacencyList.get(edge.from).push(edge.to);
            adjacencyList.get(edge.to).push(edge.from);
        }
        while (queue.length > 0) {
            const current = queue.shift();
            if (!visited.has(current)) {
                visited.add(current);
                component.push(current);
                const neighbors = adjacencyList.get(current) || [];
                for (const neighbor of neighbors) {
                    if (!visited.has(neighbor)) {
                        queue.push(neighbor);
                    }
                }
            }
        }
        return component;
    }
}
//# sourceMappingURL=relationshipAnalyzer.js.map