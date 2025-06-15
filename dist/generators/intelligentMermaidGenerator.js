export class IntelligentMermaidGenerator {
    config;
    constructor(config = {}) {
        this.config = {
            title: 'プロジェクト構造分析',
            showFrameworkInfo: true,
            showComponentTypes: true,
            showUsageContext: false,
            groupByDirectory: true,
            ...config,
        };
    }
    generateDiagram(result) {
        const lines = [];
        // Header
        lines.push('```mermaid');
        lines.push('flowchart TB');
        lines.push('');
        // Framework info comment
        if (this.config.showFrameworkInfo) {
            lines.push(`%% 🚀 検出されたフレームワーク: ${result.framework.framework}`);
            if (result.framework.version) {
                lines.push(`%% 📦 バージョン: ${result.framework.version}`);
            }
            lines.push(`%% 🎯 信頼度: ${result.framework.confidence}%`);
            lines.push('');
        }
        // Generate page-component relationships with improved layout
        this.generateEnhancedPageComponentRelationships(lines, result.pageComponentUsages);
        // Add styling
        lines.push('');
        lines.push(...this.generateEnhancedStyling());
        lines.push('```');
        return lines.join('\n');
    }
    // Enhanced version for better page-component visualization
    generatePageComponentDiagram(result) {
        const lines = [];
        // Header
        lines.push('```mermaid');
        lines.push('graph TB');
        lines.push('');
        // Framework info comment
        lines.push(`%% 🚀 フレームワーク: ${result.framework.framework} (信頼度: ${result.framework.confidence}%)`);
        lines.push('');
        // Create nodes for each page and their components
        const allComponents = new Set();
        const componentTypes = new Map();
        // First pass: collect all unique components and their types
        result.pageComponentUsages.forEach((page) => {
            page.components.forEach((component) => {
                allComponents.add(component.name);
                componentTypes.set(component.name, component.type);
            });
        });
        // Create component nodes
        allComponents.forEach((componentName) => {
            const componentId = this.sanitizeId(`comp_${componentName}`);
            const type = componentTypes.get(componentName) || 'component';
            const icon = this.getComponentTypeIcon(type);
            lines.push(`  ${componentId}["${icon} ${componentName}"]:::${type}Style`);
        });
        lines.push('');
        // Create page nodes and relationships
        result.pageComponentUsages.forEach((page) => {
            const pageId = this.sanitizeId(`page_${page.page}`);
            const pageDisplayName = this.getPageDisplayName(page.page);
            lines.push(`  ${pageId}["📄 ${pageDisplayName}"]:::pageStyle`);
            // Connect page to its components
            page.components.forEach((component) => {
                const componentId = this.sanitizeId(`comp_${component.name}`);
                lines.push(`  ${pageId} --> ${componentId}`);
            });
        });
        // Add enhanced styling
        lines.push('');
        lines.push(...this.generateEnhancedStyling());
        lines.push('```');
        return lines.join('\n');
    }
    generateMarkdownReport(result) {
        const lines = [];
        const timestamp = new Date().toLocaleString('ja-JP');
        // Header
        lines.push(`# ${this.config.title}`);
        lines.push('');
        lines.push(`**生成日時**: ${timestamp}`);
        lines.push('');
        // Framework information
        lines.push('## 🚀 検出されたフレームワーク');
        lines.push('');
        lines.push(`- **フレームワーク**: ${result.framework.framework}`);
        if (result.framework.version) {
            lines.push(`- **バージョン**: ${result.framework.version}`);
        }
        lines.push(`- **信頼度**: ${result.framework.confidence}%`);
        lines.push('');
        // Framework patterns
        if (result.framework.pagePatterns.length > 0) {
            lines.push('### ページパターン');
            result.framework.pagePatterns.forEach((pattern) => {
                lines.push(`- \`${pattern}\``);
            });
            lines.push('');
        }
        if (result.framework.componentPatterns.length > 0) {
            lines.push('### コンポーネントパターン');
            result.framework.componentPatterns.forEach((pattern) => {
                lines.push(`- \`${pattern}\``);
            });
            lines.push('');
        }
        // Statistics
        lines.push('## 📊 統計情報');
        lines.push('');
        const totalComponents = result.pageComponentUsages.reduce((sum, page) => sum + page.components.length, 0);
        lines.push(`- **総ページ数**: ${result.pageComponentUsages.length}`);
        lines.push(`- **総コンポーネント数**: ${totalComponents}`);
        lines.push(`- **解析対象ファイル数**: ${result.relevantFiles.length}`);
        lines.push('');
        // Mermaid diagram
        lines.push('## 🗺️ プロジェクト構造図');
        lines.push('');
        lines.push(this.generateDiagram(result));
        lines.push('');
        // Detailed breakdown
        lines.push('## 📄 詳細内訳');
        lines.push('');
        result.pageComponentUsages.forEach((page) => {
            lines.push(`### ${this.getPageDisplayName(page.page)}`);
            lines.push('');
            lines.push(`**ファイルパス**: \`${page.page}\``);
            lines.push('');
            if (page.components.length > 0) {
                lines.push('**使用コンポーネント**:');
                page.components.forEach((component) => {
                    const typeIcon = this.getComponentTypeIcon(component.type);
                    let componentLine = `- ${typeIcon} **${component.name}** (${component.type})`;
                    if (this.config.showUsageContext && component.usageContext) {
                        componentLine += ` - ${component.usageContext}`;
                    }
                    lines.push(componentLine);
                });
            }
            else {
                lines.push('**使用コンポーネント**: なし');
            }
            lines.push('');
        });
        // Analysis log
        if (result.analysisLog.length > 0) {
            lines.push('## 🔍 解析ログ');
            lines.push('');
            lines.push('```');
            result.analysisLog.forEach((log) => {
                lines.push(log);
            });
            lines.push('```');
            lines.push('');
        }
        return lines.join('\n');
    }
    generateEnhancedPageComponentRelationships(lines, usages) {
        // Create a cleaner visualization focused on page-component relationships
        const allComponents = new Set();
        const componentTypes = new Map();
        const componentUsageCount = new Map();
        // Collect component information
        usages.forEach((page) => {
            page.components.forEach((component) => {
                allComponents.add(component.name);
                componentTypes.set(component.name, component.type);
                componentUsageCount.set(component.name, (componentUsageCount.get(component.name) || 0) + 1);
            });
        });
        // Group components by type
        const componentsByType = new Map();
        allComponents.forEach((componentName) => {
            const type = componentTypes.get(componentName) || 'component';
            if (!componentsByType.has(type)) {
                componentsByType.set(type, []);
            }
            componentsByType.get(type).push(componentName);
        });
        // Create component type subgraphs
        componentsByType.forEach((components, type) => {
            const typeId = this.sanitizeId(`type_${type}`);
            const typeIcon = this.getComponentTypeIcon(type);
            lines.push(`  subgraph ${typeId} ["${typeIcon} ${type.toUpperCase()}"]`);
            components.forEach((componentName) => {
                const componentId = this.sanitizeId(`comp_${componentName}`);
                const usageCount = componentUsageCount.get(componentName) || 0;
                const label = usageCount > 1 ? `${componentName} (${usageCount})` : componentName;
                lines.push(`    ${componentId}["${label}"]:::${type}Style`);
            });
            lines.push('  end');
        });
        lines.push('');
        // Create page nodes
        usages.forEach((page) => {
            const pageId = this.sanitizeId(`page_${page.page}`);
            const pageDisplayName = this.getPageDisplayName(page.page);
            lines.push(`  ${pageId}["📄 ${pageDisplayName}"]:::pageStyle`);
        });
        lines.push('');
        // Create relationships
        usages.forEach((page) => {
            const pageId = this.sanitizeId(`page_${page.page}`);
            page.components.forEach((component) => {
                const componentId = this.sanitizeId(`comp_${component.name}`);
                lines.push(`  ${pageId} --> ${componentId}`);
            });
        });
    }
    generatePageComponentRelationships(lines, usages) {
        const pageGroups = this.config.groupByDirectory
            ? this.groupPagesByDirectory(usages)
            : new Map([['all', usages]]);
        pageGroups.forEach((pagesInGroup, groupName) => {
            if (this.config.groupByDirectory && pageGroups.size > 1) {
                const groupId = this.sanitizeId(groupName);
                lines.push(`  subgraph ${groupId} ["📁 ${groupName}"]`);
            }
            pagesInGroup.forEach((page) => {
                const pageId = this.sanitizeId(page.page);
                const pageDisplayName = this.getPageDisplayName(page.page);
                // Create page subgraph
                lines.push(`    subgraph ${pageId} ["${pageDisplayName}"]`);
                if (page.components.length > 0) {
                    page.components.forEach((component) => {
                        const componentId = this.sanitizeId(`${pageId}_${component.name}`);
                        const componentIcon = this.getComponentTypeIcon(component.type);
                        const componentLabel = `${componentIcon} ${component.name}`;
                        lines.push(`      ${componentId}["${componentLabel}"]`);
                    });
                }
                else {
                    // Empty page placeholder
                    lines.push(`      ${pageId}_empty[" "]`);
                    lines.push(`      style ${pageId}_empty fill:transparent,stroke:transparent`);
                }
                lines.push('    end');
            });
            if (this.config.groupByDirectory && pageGroups.size > 1) {
                lines.push('  end');
            }
        });
    }
    groupPagesByDirectory(usages) {
        const groups = new Map();
        usages.forEach((page) => {
            const dir = this.extractDirectory(page.page);
            if (!groups.has(dir)) {
                groups.set(dir, []);
            }
            groups.get(dir).push(page);
        });
        return groups;
    }
    extractDirectory(filePath) {
        const parts = filePath.split('/');
        if (parts.length <= 2)
            return 'ルート';
        // Remove filename and get parent directory
        const parentDir = parts[parts.length - 2];
        return parentDir || 'ルート';
    }
    getPageDisplayName(filePath) {
        const parts = filePath.split('/');
        const fileName = parts[parts.length - 1];
        // Remove file extension
        return fileName.replace(/\.(vue|jsx?|tsx?)$/i, '');
    }
    getComponentTypeIcon(type) {
        const iconMap = {
            component: '🧩',
            layout: '📐',
            directive: '⚡',
            utility: '🛠️',
        };
        return iconMap[type] || '📦';
    }
    sanitizeId(str) {
        return (str
            .replace(/[^a-zA-Z0-9_]/g, '_')
            .replace(/^[0-9]/, '_$&')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '') || 'id');
    }
    generateEnhancedStyling() {
        const lines = [];
        lines.push('%% 🎨 Enhanced Styling');
        lines.push('classDef pageStyle fill:#e3f2fd,stroke:#1976d2,stroke-width:3px,color:#000,font-weight:bold;');
        lines.push('classDef componentStyle fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px,color:#000;');
        lines.push('classDef layoutStyle fill:#e8f5e8,stroke:#388e3c,stroke-width:2px,color:#000;');
        lines.push('classDef directiveStyle fill:#fff3e0,stroke:#f57c00,stroke-width:2px,color:#000;');
        lines.push('classDef utilityStyle fill:#fce4ec,stroke:#c2185b,stroke-width:2px,color:#000;');
        lines.push('classDef groupStyle fill:#f5f5f5,stroke:#757575,stroke-width:1px,color:#424242;');
        return lines;
    }
    generateStyling() {
        const lines = [];
        lines.push('%% 🎨 Styling');
        lines.push('classDef pageStyle fill:#e1f5fe,stroke:#01579b,stroke-width:2px,color:#000;');
        lines.push('classDef componentStyle fill:#f3e5f5,stroke:#4a148c,stroke-width:1px,color:#000;');
        lines.push('classDef layoutStyle fill:#e8f5e8,stroke:#1b5e20,stroke-width:1px,color:#000;');
        lines.push('classDef directiveStyle fill:#fff3e0,stroke:#e65100,stroke-width:1px,color:#000;');
        lines.push('classDef utilityStyle fill:#fce4ec,stroke:#880e4f,stroke-width:1px,color:#000;');
        return lines;
    }
}
//# sourceMappingURL=intelligentMermaidGenerator.js.map