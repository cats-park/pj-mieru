export class PageMermaidGenerator {
    config;
    constructor(config = {}) {
        this.config = {
            direction: config.direction || 'TD',
            groupPages: config.groupPages ?? true,
            showComponents: config.showComponents ?? false,
            showLinkLabels: config.showLinkLabels ?? true,
            maxNestDepth: config.maxNestDepth || 5,
        };
    }
    generateDiagram(pageStructure) {
        const { pages, pageLinks, stats } = pageStructure;
        const lines = [];
        // Header
        lines.push(`flowchart ${this.config.direction}`);
        lines.push('');
        // Generate page-centric subgraphs with components
        pages.forEach((page, pageId) => {
            const pageIcon = this.getPageIcon(page);
            const displayName = this.getDisplayName(page);
            const pageNodeId = this.sanitizePageId(page);
            const subgraphId = `page_${pageNodeId}`;
            const pageLabel = this.generateSubgraphLabel(page);
            lines.push(`  subgraph ${subgraphId} ["${pageLabel}"]`);
            // Add components used by this page (no page node itself)
            if (page.components && page.components.length > 0) {
                // Group components by depth for hierarchical display
                const componentsByDepth = this.groupComponentsByDepth(page.components);
                // Display components hierarchically
                this.addComponentsHierarchically(lines, componentsByDepth, pageNodeId);
            }
            else {
                // Add empty placeholder if no components
                lines.push(`    ${pageNodeId}_empty[" "]`);
                lines.push(`    style ${pageNodeId}_empty fill:transparent,stroke:transparent`);
            }
            lines.push('  end');
            lines.push('');
        });
        // Add beautiful styling
        lines.push(...this.generateBeautifulStyling());
        // Add interactive stats
        lines.push('');
        lines.push(`%% 📊 プロジェクト統計`);
        lines.push(`%% 🗂️ 総ページ数: ${stats.totalPages}`);
        lines.push(`%% 🧩 総コンポーネント数: ${stats.totalComponents}`);
        lines.push(`%% ⚡ 解析時間: ${stats.analysisTime}ms`);
        return lines.join('\n');
    }
    groupPagesByFunction(pages) {
        const groups = new Map();
        pages.forEach((page) => {
            const groupName = this.determinePageGroup(page);
            if (!groups.has(groupName)) {
                groups.set(groupName, []);
            }
            groups.get(groupName).push(page);
        });
        return groups;
    }
    determinePageGroup(page) {
        const pathLower = page.filePath.toLowerCase();
        const routeLower = page.route.toLowerCase();
        // Business unit
        if (pathLower.includes('sjpn1971'))
            return 'SJPN1971 Business';
        // Content sections
        if (pathLower.includes('sustaina-techo') ||
            routeLower.includes('sustaina-techo'))
            return 'サステナ手帖';
        if (pathLower.includes('sustainable') || routeLower.includes('sustainable'))
            return 'サステナソリューション';
        if (pathLower.includes('plazukan') || pathLower.includes('material'))
            return 'プラ図鑑';
        // Content types
        if (pathLower.includes('news') || routeLower.includes('news'))
            return 'ニュース';
        if (pathLower.includes('seminar') || routeLower.includes('seminar'))
            return 'セミナー';
        if (pathLower.includes('document') || routeLower.includes('document'))
            return 'ドキュメント';
        if (pathLower.includes('product') || routeLower.includes('product'))
            return '製品情報';
        // Admin/utility pages
        if (pathLower.includes('contact') || routeLower.includes('contact'))
            return 'お問い合わせ';
        if (pathLower.includes('download') || routeLower.includes('download'))
            return 'ダウンロード';
        if (pathLower.includes('search') || routeLower.includes('search'))
            return '検索';
        if (pathLower.includes('thanks') || routeLower.includes('thanks'))
            return 'サンクスページ';
        // Legal pages
        if (pathLower.includes('privacy') ||
            pathLower.includes('policy') ||
            pathLower.includes('terms'))
            return '法的ページ';
        // Main pages
        if (page.name === 'pages' ||
            routeLower === '/' ||
            pathLower.includes('index'))
            return 'メインページ';
        if (pathLower.includes('about') || pathLower.includes('company'))
            return '企業情報';
        return 'その他';
    }
    generateSubgraphLabel(page) {
        // Create path-style label for subgraph
        const relativePath = page.filePath.replace(/.*\/src\//, '/');
        const cleanPath = relativePath.replace(/\.(vue|jsx?|tsx?)$/, '');
        return cleanPath;
    }
    generatePageNode(page) {
        const pageId = this.sanitizePageId(page);
        const pageIcon = this.getPageIcon(page);
        const displayName = this.getDisplayName(page);
        const routeText = page.route !== '/' ? ` | ${page.route}` : '';
        return `${pageId}["${pageIcon} ${displayName}${routeText}"]`;
    }
    getGroupIcon(groupName) {
        const iconMap = {
            メインページ: '🏠',
            企業情報: '🏢',
            'SJPN1971 Business': '🏭',
            サステナ手帖: '📚',
            サステナソリューション: '🌱',
            プラ図鑑: '🔬',
            ニュース: '📰',
            セミナー: '🎓',
            ドキュメント: '📄',
            製品情報: '📦',
            お問い合わせ: '📞',
            ダウンロード: '⬇️',
            検索: '🔍',
            サンクスページ: '🙏',
            法的ページ: '⚖️',
            その他: '📋',
        };
        return iconMap[groupName] || '📄';
    }
    getPageIcon(page) {
        const pathLower = page.filePath.toLowerCase();
        const nameLower = page.name.toLowerCase();
        // Special pages
        if (nameLower.includes('index') || page.route === '/')
            return '🏠';
        if (nameLower.includes('about'))
            return '👥';
        if (nameLower.includes('contact'))
            return '📞';
        if (nameLower.includes('news'))
            return '📰';
        if (nameLower.includes('search'))
            return '🔍';
        if (nameLower.includes('download'))
            return '⬇️';
        if (nameLower.includes('thanks'))
            return '🙏';
        if (pathLower.includes('[slug]') || pathLower.includes('[category]'))
            return '🔗';
        // Content types
        if (pathLower.includes('material'))
            return '🔬';
        if (pathLower.includes('seminar'))
            return '🎓';
        if (pathLower.includes('product'))
            return '📦';
        if (pathLower.includes('document'))
            return '📄';
        return '📄';
    }
    getDisplayName(page) {
        // Create more readable display names
        const name = page.name;
        // Handle special cases
        if (name === 'pages' && page.route === '/')
            return 'ホーム';
        if (name.includes('[slug]'))
            return name.replace('[slug]', '詳細ページ');
        if (name.includes('[category]'))
            return name.replace('[category]', 'カテゴリ');
        // Capitalize first letter
        return name.charAt(0).toUpperCase() + name.slice(1);
    }
    sanitizePageId(page) {
        // Create short, meaningful IDs
        const pathSegments = page.filePath.split('/');
        const fileName = pathSegments[pathSegments.length - 1];
        const dirName = pathSegments[pathSegments.length - 2];
        let id = page.name;
        if (dirName && dirName !== 'pages' && dirName !== '.') {
            id = `${dirName}_${page.name}`;
        }
        return id
            .replace(/[^a-zA-Z0-9_]/g, '_')
            .replace(/_{2,}/g, '_')
            .replace(/^_|_$/g, '')
            .toLowerCase();
    }
    sanitizeComponentId(componentName, pageId) {
        const sanitized = componentName
            .replace(/[^a-zA-Z0-9_]/g, '_')
            .replace(/_{2,}/g, '_')
            .replace(/^_|_$/g, '')
            .toLowerCase();
        return `${pageId}_comp_${sanitized}`;
    }
    getComponentIcon(componentName) {
        const nameLower = componentName.toLowerCase();
        // UI Components
        if (nameLower.includes('button'))
            return '🔘';
        if (nameLower.includes('modal') || nameLower.includes('dialog'))
            return '📋';
        if (nameLower.includes('header') || nameLower.includes('navbar'))
            return '📊';
        if (nameLower.includes('footer'))
            return '📄';
        if (nameLower.includes('sidebar') || nameLower.includes('menu'))
            return '📂';
        if (nameLower.includes('form'))
            return '📝';
        if (nameLower.includes('input') || nameLower.includes('field'))
            return '📝';
        if (nameLower.includes('table') || nameLower.includes('list'))
            return '📋';
        if (nameLower.includes('card'))
            return '🗂️';
        if (nameLower.includes('layout'))
            return '🗂️';
        // Content Components
        if (nameLower.includes('image') || nameLower.includes('img'))
            return '🖼️';
        if (nameLower.includes('video'))
            return '🎬';
        if (nameLower.includes('audio'))
            return '🔊';
        // Navigation Components
        if (nameLower.includes('link') || nameLower.includes('nav'))
            return '🔗';
        if (nameLower.includes('breadcrumb'))
            return '🍞';
        if (nameLower.includes('tab'))
            return '📑';
        // Default component icon
        return '🧩';
    }
    sanitizeId(input) {
        // Create a map for Japanese group names to valid IDs
        const groupIdMap = {
            メインページ: 'main_pages',
            企業情報: 'company_info',
            'SJPN1971 Business': 'sjpn1971_business',
            サステナ手帖: 'sustaina_techo',
            サステナソリューション: 'sustaina_solution',
            プラ図鑑: 'plazukan',
            ニュース: 'news',
            セミナー: 'seminar',
            ドキュメント: 'documents',
            製品情報: 'products',
            お問い合わせ: 'contact',
            ダウンロード: 'download',
            検索: 'search',
            サンクスページ: 'thanks',
            法的ページ: 'legal',
            その他: 'others',
        };
        // Use mapped ID if available, otherwise sanitize
        if (groupIdMap[input]) {
            return groupIdMap[input];
        }
        return (input
            .replace(/[^a-zA-Z0-9_]/g, '_')
            .replace(/_{2,}/g, '_')
            .replace(/^_|_$/g, '')
            .toLowerCase() || 'unknown');
    }
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }
    getConfig() {
        return { ...this.config };
    }
    groupComponentsByDepth(components) {
        const depthMap = new Map();
        components.forEach((component) => {
            const depth = component.depth || 0;
            if (!depthMap.has(depth)) {
                depthMap.set(depth, []);
            }
            depthMap.get(depth).push(component);
        });
        return depthMap;
    }
    addComponentsHierarchically(lines, componentsByDepth, pageNodeId) {
        // Sort by depth (0 first, then 1, 2, etc.)
        const sortedDepths = Array.from(componentsByDepth.keys()).sort((a, b) => a - b);
        sortedDepths.forEach((depth) => {
            const componentsAtDepth = componentsByDepth.get(depth);
            componentsAtDepth.forEach((component) => {
                const componentId = this.sanitizeComponentId(component.name, pageNodeId);
                const componentIcon = this.getComponentIcon(component.name);
                let displayName = component.name;
                // Add depth indicator for nested components
                if (depth > 0) {
                    const indent = '  '.repeat(depth);
                    displayName = `${indent}${component.name}`;
                    // Add parent information if available
                    if (component.parent) {
                        displayName += ` (used by ${component.parent})`;
                    }
                }
                lines.push(`    ${componentId}["${componentIcon} ${displayName}"]`);
                // Add connections between parent and child components
                if (depth > 0 && component.parent) {
                    const parentId = this.sanitizeComponentId(component.parent, pageNodeId);
                    lines.push(`    ${parentId} --> ${componentId}`);
                }
            });
        });
    }
    generateBeautifulStyling() {
        const lines = [];
        lines.push('  %% 🎨 Beautiful Styling');
        // Page styling with solid colors (linear-gradient not supported in all Mermaid versions)
        lines.push('  classDef mainPage fill:#667eea, stroke:#4C51BF, stroke-width:3px, color:#fff;');
        lines.push('  classDef contentPage fill:#f093fb, stroke:#E53E3E, stroke-width:2px, color:#fff;');
        lines.push('  classDef businessPage fill:#4facfe, stroke:#3182CE, stroke-width:2px, color:#fff;');
        lines.push('  classDef utilityPage fill:#43e97b, stroke:#38A169, stroke-width:2px, color:#fff;');
        lines.push('  classDef adminPage fill:#fa709a, stroke:#D69E2E, stroke-width:2px, color:#fff;');
        // Subgraph styling
        lines.push('  classDef groupMain fill:#f7fafc, stroke:#2D3748, stroke-width:3px;');
        lines.push('  classDef groupContent fill:#fef5e7, stroke:#C05621, stroke-width:2px;');
        lines.push('  classDef groupBusiness fill:#e6fffa, stroke:#319795, stroke-width:2px;');
        lines.push('  classDef groupUtility fill:#f0fff4, stroke:#48BB78, stroke-width:2px;');
        return lines;
    }
}
//# sourceMappingURL=pageMermaidGenerator.js.map