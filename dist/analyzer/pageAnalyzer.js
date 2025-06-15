import path from 'path';
import fs from 'fs';
export class PageAnalyzer {
    pagePatterns = [
        /\/pages\//,
        /\/views\//,
        /\/routes\//,
        /\/screens\//,
        /page\.(vue|jsx?|tsx?)$/,
        /index\.(vue|jsx?|tsx?)$/,
    ];
    linkPatterns = [
        // Nuxt.js specific components
        /<NuxtLink[^>]+to=["']([^"']+)["']/gi,
        /<nuxt-link[^>]+to=["']([^"']+)["']/gi,
        // Vue Router
        /<router-link[^>]+to=["']([^"']+)["']/gi,
        // React Router
        /<Link[^>]+to=["']([^"']+)["']/gi,
        /<NavLink[^>]+to=["']([^"']+)["']/gi,
        // HTML links
        /<a[^>]+href=["']([^"']+)["']/gi,
        // Dynamic href with baseUrl
        /:href="\$baseUrl\(['"`]([^'"`]+)['"`]\)"/gi,
        /href="\$baseUrl\(['"`]([^'"`]+)['"`]\)"/gi,
        // JavaScript router calls
        /router\.push\(['"`]([^'"`]+)['"`]\)/gi,
        /\$router\.push\(['"`]([^'"`]+)['"`]\)/gi,
        /this\.\$router\.push\(['"`]([^'"`]+)['"`]\)/gi,
        // Nuxt navigation
        /navigateTo\(['"`]([^'"`]+)['"`]\)/gi,
        /await\s+navigateTo\(['"`]([^'"`]+)['"`]\)/gi,
        /navigate\(['"`]([^'"`]+)['"`]\)/gi,
        // Vue 3 Composition API
        /useRouter\(\)\.push\(['"`]([^'"`]+)['"`]\)/gi,
        // Object routes in templates
        /:to="\{[^}]*path:\s*['"`]([^'"`]+)['"`]/gi,
        /:to="[^"]*['"`]([^'"`]+)['"`]/gi,
        // Dynamic route binding
        /:to="`([^`]*\/[^`]*)`"/gi,
        /:href="`([^`]*\/[^`]*)`"/gi,
        // Route names and paths
        /name:\s*['"`]([^'"`]+)['"`]/gi,
        /path:\s*['"`]([^'"`]+)['"`]/gi,
    ];
    async analyzePages(files, astResults, vueResults) {
        const startTime = Date.now();
        // Identify page files
        const pageFiles = this.identifyPageFiles(files);
        const pages = new Map();
        // Analyze each page
        for (const file of pageFiles) {
            const pageInfo = await this.analyzePage(file, astResults, vueResults);
            pages.set(file.path, pageInfo);
        }
        // Recursively expand component dependencies
        await this.expandComponentDependencies(pages, files, astResults, vueResults);
        // Analyze page connections
        const pageLinks = this.analyzePageConnections(pages);
        const endTime = Date.now();
        // Calculate statistics
        const stats = {
            totalPages: pages.size,
            totalComponents: Array.from(pages.values()).reduce((sum, page) => sum + page.components.length, 0),
            totalLinks: pageLinks.reduce((sum, link) => sum + link.weight, 0),
            isolatedPages: this.countIsolatedPages(pages, pageLinks),
            analysisTime: endTime - startTime,
        };
        return {
            pages,
            pageLinks,
            stats,
        };
    }
    identifyPageFiles(files) {
        return files.filter((file) => {
            // Check against page patterns
            return (this.pagePatterns.some((pattern) => pattern.test(file.path)) ||
                this.pagePatterns.some((pattern) => pattern.test(file.relativePath)));
        });
    }
    async analyzePage(file, astResults, vueResults) {
        // Find corresponding analysis result
        const astResult = astResults.find((r) => r.filePath === file.path);
        const vueResult = vueResults.find((r) => r.filePath === file.path);
        // Extract components used in this page
        const components = this.extractPageComponents(astResult, vueResult, file.path);
        // Extract page links
        const links = await this.extractPageLinks(file.path);
        // Generate route from file path
        const route = this.generateRoute(file.relativePath);
        return {
            filePath: file.path,
            name: this.generatePageName(file.relativePath),
            route,
            type: this.determinePageType(file.relativePath),
            components,
            links,
            size: file.size,
            lastModified: new Date(file.lastModified),
        };
    }
    extractPageComponents(astResult, vueResult, filePath) {
        const components = [];
        // Extract from Vue SFC result
        if (vueResult && vueResult.success) {
            vueResult.imports.forEach((imp) => {
                if (this.isComponentImport(imp.source)) {
                    components.push({
                        name: imp.name || path.basename(imp.source, path.extname(imp.source)),
                        importPath: imp.source,
                        usageLines: [imp.line],
                        type: this.getComponentType(imp.source),
                    });
                }
            });
            // Add component usages
            vueResult.componentUsages.forEach((usage) => {
                const existing = components.find((c) => c.name === usage.name);
                if (existing) {
                    existing.usageLines.push(usage.line);
                }
                else {
                    components.push({
                        name: usage.name,
                        importPath: '',
                        usageLines: [usage.line],
                        type: 'component',
                    });
                }
            });
        }
        // Extract from AST result
        if (astResult) {
            astResult.imports.forEach((imp) => {
                if (this.isComponentImport(imp.source)) {
                    components.push({
                        name: imp.name || path.basename(imp.source, path.extname(imp.source)),
                        importPath: imp.source,
                        usageLines: [imp.line],
                        type: this.getComponentType(imp.source),
                    });
                }
            });
        }
        // Additional template parsing for Vue files
        if (filePath && filePath.endsWith('.vue')) {
            const templateComponents = this.extractTemplateComponents(filePath);
            templateComponents.forEach((comp) => {
                const existing = components.find((c) => c.name === comp.name);
                if (existing) {
                    existing.usageLines.push(...comp.usageLines);
                }
                else {
                    components.push(comp);
                }
            });
        }
        // Remove duplicates
        return this.deduplicateComponents(components);
    }
    extractTemplateComponents(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const components = [];
            // Extract template section
            const templateMatch = content.match(/<template[^>]*>([\s\S]*?)<\/template>/);
            if (!templateMatch)
                return components;
            const templateContent = templateMatch[1];
            // Component usage patterns
            const componentPatterns = [
                // Standard Vue components
                /<([A-Z][a-zA-Z0-9]*)\b[^>]*>/gi,
                // Kebab-case components
                /<([a-z]+-[a-z-]+)\b[^>]*>/gi,
                // Self-closing components
                /<([A-Z][a-zA-Z0-9]*)\b[^>]*\/>/gi,
                /<([a-z]+-[a-z-]+)\b[^>]*\/>/gi,
            ];
            componentPatterns.forEach((pattern) => {
                let match;
                while ((match = pattern.exec(templateContent)) !== null) {
                    const componentName = match[1];
                    // Skip HTML elements and Vue directives
                    if (this.isValidComponentName(componentName)) {
                        const lineNumber = this.getLineNumber(templateContent, match.index);
                        const existing = components.find((c) => c.name === componentName);
                        if (existing) {
                            existing.usageLines.push(lineNumber);
                        }
                        else {
                            components.push({
                                name: componentName,
                                importPath: '', // Will be resolved later
                                usageLines: [lineNumber],
                                type: 'component',
                            });
                        }
                    }
                }
            });
            return components;
        }
        catch (error) {
            console.warn(`Failed to extract template components from ${filePath}:`, error);
            return [];
        }
    }
    isValidComponentName(name) {
        // Skip HTML elements
        const htmlElements = [
            'div',
            'span',
            'p',
            'a',
            'img',
            'h1',
            'h2',
            'h3',
            'h4',
            'h5',
            'h6',
            'ul',
            'ol',
            'li',
            'table',
            'tr',
            'td',
            'th',
            'thead',
            'tbody',
            'section',
            'article',
            'header',
            'footer',
            'nav',
            'main',
            'aside',
            'button',
            'input',
            'form',
            'label',
            'select',
            'option',
            'textarea',
        ];
        // Skip Vue directives and slots
        const vueElements = [
            'template',
            'slot',
            'transition',
            'keep-alive',
            'component',
        ];
        const lowerName = name.toLowerCase();
        return (!htmlElements.includes(lowerName) &&
            !vueElements.includes(lowerName) &&
            !lowerName.startsWith('v-') &&
            (name[0] === name[0].toUpperCase() || name.includes('-')));
    }
    async extractPageLinks(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const links = [];
            this.linkPatterns.forEach((pattern) => {
                let match;
                while ((match = pattern.exec(content)) !== null) {
                    const target = match[1];
                    if (target &&
                        !target.startsWith('http') &&
                        !target.startsWith('mailto:') &&
                        !target.startsWith('tel:')) {
                        links.push({
                            target,
                            type: this.determineLinkType(pattern.source),
                            text: this.extractLinkText(content, match.index),
                            line: this.getLineNumber(content, match.index),
                        });
                    }
                }
            });
            return links;
        }
        catch (error) {
            return [];
        }
    }
    analyzePageConnections(pages) {
        const connections = [];
        const connectionMap = new Map();
        pages.forEach((page) => {
            page.links.forEach((link) => {
                // Find target page
                const targetPage = this.findPageByRoute(pages, link.target);
                if (targetPage) {
                    const connectionKey = `${page.filePath}->${targetPage.filePath}`;
                    if (connectionMap.has(connectionKey)) {
                        connectionMap.get(connectionKey).weight++;
                    }
                    else {
                        connectionMap.set(connectionKey, {
                            from: page.filePath,
                            to: targetPage.filePath,
                            type: this.mapLinkTypeToConnectionType(link.type),
                            weight: 1,
                        });
                    }
                }
            });
        });
        return Array.from(connectionMap.values());
    }
    isComponentImport(source) {
        // Check if import path looks like a component
        return (source.includes('component') ||
            source.includes('Component') ||
            /\.(vue|jsx|tsx)$/.test(source) ||
            /^[A-Z]/.test(path.basename(source, path.extname(source))));
    }
    getComponentType(importPath) {
        if (importPath.endsWith('.vue'))
            return 'vue';
        if (importPath.endsWith('.jsx') || importPath.endsWith('.tsx'))
            return 'react';
        if (importPath.includes('layout') || importPath.includes('Layout'))
            return 'layout';
        return 'component';
    }
    generateRoute(relativePath) {
        // Convert file path to route
        let route = relativePath
            .replace(/^(pages|views|routes)\//, '/')
            .replace(/\.(vue|jsx?|tsx?)$/, '')
            .replace(/\/index$/, '')
            .replace(/\[([^\]]+)\]/g, ':$1'); // Dynamic routes
        return route || '/';
    }
    generatePageName(relativePath) {
        const baseName = path.basename(relativePath, path.extname(relativePath));
        return baseName === 'index'
            ? path.basename(path.dirname(relativePath)) || 'Home'
            : baseName;
    }
    determinePageType(relativePath) {
        if (relativePath.includes('layout') || relativePath.includes('Layout')) {
            return 'layout';
        }
        if (relativePath.includes('page') || relativePath.includes('view')) {
            return 'page';
        }
        return 'component';
    }
    determineLinkType(patternSource) {
        if (patternSource.includes('router-link') ||
            patternSource.includes('nuxt-link')) {
            return 'router-link';
        }
        if (patternSource.includes('href')) {
            return 'href';
        }
        if (patternSource.includes('push') || patternSource.includes('navigate')) {
            return 'dynamic';
        }
        return 'navigation';
    }
    mapLinkTypeToConnectionType(linkType) {
        switch (linkType) {
            case 'router-link':
            case 'dynamic':
                return 'route';
            case 'href':
                return 'link';
            default:
                return 'navigation';
        }
    }
    deduplicateComponents(components) {
        const map = new Map();
        components.forEach((comp) => {
            const key = `${comp.name}-${comp.importPath}`;
            if (map.has(key)) {
                const existing = map.get(key);
                existing.usageLines.push(...comp.usageLines);
            }
            else {
                map.set(key, { ...comp, usageLines: [...comp.usageLines] });
            }
        });
        return Array.from(map.values());
    }
    findPageByRoute(pages, route) {
        // Clean up the route for matching
        const cleanRoute = route.replace(/^#/, '').replace(/\/$/, '') || '/';
        // First try exact match
        const exactMatch = Array.from(pages.values()).find((page) => page.route === cleanRoute);
        if (exactMatch)
            return exactMatch;
        // Try matching with trailing slash
        const withSlash = Array.from(pages.values()).find((page) => page.route === `${cleanRoute}/` || `${page.route}/` === cleanRoute);
        if (withSlash)
            return withSlash;
        // Try partial match for dynamic routes
        const partialMatch = Array.from(pages.values()).find((page) => {
            const pageRoute = page.route.replace(/:\w+/g, '[^/]+'); // Convert :param to regex
            const regex = new RegExp(`^${pageRoute}/?$`);
            return regex.test(cleanRoute);
        });
        if (partialMatch)
            return partialMatch;
        // Try to match by file name/path
        const pathMatch = Array.from(pages.values()).find((page) => {
            const pageName = page.name.toLowerCase();
            const routeParts = cleanRoute.split('/').filter(Boolean);
            return routeParts.some((part) => part === pageName);
        });
        return pathMatch;
    }
    countIsolatedPages(pages, connections) {
        const connectedPages = new Set();
        connections.forEach((conn) => {
            connectedPages.add(conn.from);
            connectedPages.add(conn.to);
        });
        return pages.size - connectedPages.size;
    }
    extractLinkText(content, index) {
        // Simple extraction of link text - can be improved
        const beforeIndex = Math.max(0, index - 50);
        const afterIndex = Math.min(content.length, index + 100);
        const snippet = content.slice(beforeIndex, afterIndex);
        const match = snippet.match(/>([^<]+)</);
        return match ? match[1].trim() : '';
    }
    getLineNumber(content, index) {
        return content.substring(0, index).split('\n').length;
    }
    /**
     * Recursively expand component dependencies
     */
    async expandComponentDependencies(pages, files, astResults, vueResults) {
        const processedComponents = new Set();
        for (const [pageId, page] of pages) {
            const expandedComponents = await this.getComponentDependenciesRecursively(page.components, files, astResults, vueResults, processedComponents, 0 // depth
            );
            // Update page components with expanded list
            page.components = this.deduplicateComponents(expandedComponents);
        }
    }
    /**
     * Recursively get all component dependencies
     */
    async getComponentDependenciesRecursively(components, files, astResults, vueResults, processed, depth, maxDepth = 3) {
        if (depth >= maxDepth)
            return components;
        const allComponents = [...components];
        for (const component of components) {
            if (processed.has(component.name))
                continue;
            processed.add(component.name);
            // Find component file
            const componentFile = this.findComponentFile(component, files);
            if (!componentFile)
                continue;
            // Get analysis results for this component
            const astResult = astResults.find((r) => r.filePath === componentFile.path);
            const vueResult = vueResults.find((r) => r.filePath === componentFile.path);
            // Extract components used by this component
            const subComponents = this.extractPageComponents(astResult, vueResult, componentFile.path);
            // Add depth information to sub-components
            const subComponentsWithDepth = subComponents.map((comp) => ({
                ...comp,
                depth: depth + 1,
                parent: component.name,
            }));
            // Recursively get dependencies of sub-components
            const expandedSubComponents = await this.getComponentDependenciesRecursively(subComponentsWithDepth, files, astResults, vueResults, processed, depth + 1, maxDepth);
            allComponents.push(...expandedSubComponents);
        }
        return allComponents;
    }
    /**
     * Find component file by name or import path
     */
    findComponentFile(component, files) {
        // First try exact import path match
        if (component.importPath) {
            const exactMatch = files.find((f) => f.path.endsWith(component.importPath));
            if (exactMatch)
                return exactMatch;
        }
        // Try to find by component name
        const nameVariations = [
            `${component.name}.vue`,
            `${component.name}.jsx`,
            `${component.name}.tsx`,
            `${component.name}.js`,
            `${component.name}/index.vue`,
            `${component.name}/index.jsx`,
            `${component.name}/index.tsx`,
            `${component.name}/index.js`,
        ];
        for (const variation of nameVariations) {
            const match = files.find((f) => f.path.endsWith(variation) ||
                f.path.endsWith(`components/${variation}`));
            if (match)
                return match;
        }
        return null;
    }
}
//# sourceMappingURL=pageAnalyzer.js.map