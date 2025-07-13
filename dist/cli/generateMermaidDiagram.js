export function createMermaidDiagram(pages) {
    if (pages.length === 0) {
        return `flowchart LR
  empty["ページが検出されませんでした"]
  style empty fill:#FFF3CD,stroke:#856404,color:#856404`;
    }
    let mermaid = `flowchart TB

%% ページ構造図
%% 階層構造をsubgraphで表現

`;
    pages.forEach((page, index) => {
        const pageId = `page${index + 1}`;
        // ページのsubgraphを作成
        mermaid += `  subgraph ${pageId} ["📄 ${page.name}"]\n`;
        mermaid += `    direction TB\n`;
        if (page.components.length === 0) {
            mermaid += `    ${pageId}_placeholder[" "]\n`;
            mermaid += `    style ${pageId}_placeholder fill:transparent,stroke:transparent\n`;
        }
        else {
            let compCounter = 0;
            const addComponentHierarchy = (comp, depth = 0, indentLevel = 1) => {
                const compId = `${pageId}_comp${compCounter++}`;
                const icon = getComponentIcon(comp.type);
                const blueIntensity = getBlueColorByDepth(depth);
                const indent = '  '.repeat(indentLevel);
                // コンポーネントに子がある場合はsubgraphとして描画
                if (comp.children && comp.children.length > 0) {
                    mermaid += `${indent}  subgraph ${compId} ["🧩 ${comp.name}"]\n`;
                    mermaid += `${indent}    direction TB\n`;
                    // 子コンポーネントを再帰的に追加（正しいインデントで配置）
                    comp.children.forEach((child) => {
                        const childId = `${pageId}_comp${compCounter++}`;
                        const childIcon = getComponentIcon(child.type);
                        const childBlueIntensity = getBlueColorByDepth(depth + 1);
                        if (child.children && child.children.length > 0) {
                            // 子コンポーネントにも子がある場合
                            mermaid += `${indent}    subgraph ${childId} ["🧩 ${child.name}"]\n`;
                            mermaid += `${indent}      direction TB\n`;
                            // 孫コンポーネントを追加
                            child.children.forEach((grandChild) => {
                                const grandChildId = `${pageId}_comp${compCounter++}`;
                                const grandChildIcon = getComponentIcon(grandChild.type);
                                const grandChildBlueIntensity = getBlueColorByDepth(depth + 2);
                                mermaid += `${indent}      ${grandChildId}["${grandChildIcon} ${grandChild.name}"]\n`;
                                mermaid += `${indent}      style ${grandChildId} fill:${grandChildBlueIntensity.fill},stroke:${grandChildBlueIntensity.stroke},color:#FFFFFF\n`;
                            });
                            mermaid += `${indent}    end\n`;
                            mermaid += `${indent}    style ${childId} fill:${childBlueIntensity.fill},stroke:${childBlueIntensity.stroke},color:#FFFFFF\n`;
                        }
                        else {
                            // 子コンポーネントに子がない場合
                            mermaid += `${indent}    ${childId}["${childIcon} ${child.name}"]\n`;
                            mermaid += `${indent}    style ${childId} fill:${childBlueIntensity.fill},stroke:${childBlueIntensity.stroke},color:#FFFFFF\n`;
                        }
                    });
                    mermaid += `${indent}  end\n`;
                    mermaid += `${indent}  style ${compId} fill:${blueIntensity.fill},stroke:${blueIntensity.stroke},color:#FFFFFF\n`;
                }
                else {
                    // 子がない場合は通常のノードとして描画
                    mermaid += `${indent}  ${compId}["${icon} ${comp.name}"]\n`;
                    mermaid += `${indent}  style ${compId} fill:${blueIntensity.fill},stroke:${blueIntensity.stroke},color:#FFFFFF\n`;
                }
            };
            page.components.forEach((comp) => {
                addComponentHierarchy(comp, 0, 1);
            });
        }
        mermaid += `  end\n`;
        mermaid += `  style ${pageId} fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32\n\n`;
    });
    // ページ間に見えない接続線を追加して縦並びを強制
    for (let i = 0; i < pages.length - 1; i++) {
        const currentPageId = `page${i + 1}`;
        const nextPageId = `page${i + 2}`;
        mermaid += `  ${currentPageId} -.-> ${nextPageId}\n`;
    }
    // 見えない接続線のスタイル
    for (let i = 0; i < pages.length - 1; i++) {
        mermaid += `  linkStyle ${i} stroke:transparent\n`;
    }
    return mermaid;
}
// 深度に応じた青色の取得関数
function getBlueColorByDepth(depth) {
    const colors = [
        { fill: '#7BB3F0', stroke: '#4A90E2' }, // 深度0: 明るい青
        { fill: '#5A9FDD', stroke: '#3A7BD5' }, // 深度1: 中間の青
        { fill: '#4A8CCA', stroke: '#2A6BC8' }, // 深度2: 濃い青
        { fill: '#3A79B7', stroke: '#1A5BB5' }, // 深度3: より濃い青
        { fill: '#2A66A4', stroke: '#0A4BA2' }, // 深度4: 最も濃い青
    ];
    // 深度が配列の範囲を超えた場合は最後の色を使用
    const colorIndex = Math.min(depth, colors.length - 1);
    return colors[colorIndex];
}
// コンポーネントアイコン取得関数
function getComponentIcon(type) {
    switch (type) {
        case 'component':
            return '🧩';
        case 'layout':
            return '📐';
        case 'utility':
            return '🔧';
        case 'hook':
            return '🎣';
        default:
            return '📦';
    }
}
//# sourceMappingURL=generateMermaidDiagram.js.map