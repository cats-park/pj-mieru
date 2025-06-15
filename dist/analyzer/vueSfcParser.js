import * as fs from 'fs';
import { parse } from '@vue/compiler-sfc';
import { AstParser } from './astParser.js';
/**
 * Vue単一ファイルコンポーネント（SFC）解析クラス
 */
export class VueSfcParser {
    astParser;
    constructor() {
        this.astParser = new AstParser();
    }
    /**
     * Vueファイルを解析
     */
    async analyzeFile(filePath, options = {}) {
        const startTime = Date.now();
        try {
            // ファイル読み込み
            if (!fs.existsSync(filePath)) {
                return this.createErrorResult(filePath, 'ファイルが存在しません');
            }
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            // Vue SFCをパース
            const { descriptor, errors } = parse(fileContent, {
                filename: filePath,
                sourceMap: options.sourceMap || false,
            });
            if (errors.length > 0) {
                const errorMessage = errors.map((err) => err.message).join('; ');
                return this.createErrorResult(filePath, `Vue SFC解析エラー: ${errorMessage}`);
            }
            // 解析結果の初期化
            const result = {
                filePath,
                success: true,
                imports: [],
                exports: [],
                definitions: [],
                componentUsages: [],
                styles: [],
                customBlocks: [],
            };
            // スクリプトブロックの処理
            if (descriptor.script || descriptor.scriptSetup) {
                const scriptBlock = descriptor.script || descriptor.scriptSetup;
                if (scriptBlock) {
                    result.script = this.parseScriptBlock(scriptBlock, fileContent);
                    // スクリプト内容をAST解析
                    await this.analyzeScriptContent(result.script.content, result, options);
                }
            }
            // テンプレートブロックの処理
            if (descriptor.template) {
                result.template = this.parseTemplateBlock(descriptor.template, fileContent);
                // テンプレート内のコンポーネント使用を解析
                this.analyzeTemplateComponents(result.template.content, result);
            }
            // スタイルブロックの処理
            if (descriptor.styles && descriptor.styles.length > 0) {
                result.styles = descriptor.styles.map((style) => this.parseStyleBlock(style, fileContent));
            }
            // カスタムブロックの処理
            if (options.includeCustomBlocks && descriptor.customBlocks) {
                result.customBlocks = descriptor.customBlocks.map((block) => ({
                    type: block.type,
                    content: block.content,
                    attrs: block.attrs || {},
                    startLine: this.getLineNumber(fileContent, block.loc.start.offset),
                    endLine: this.getLineNumber(fileContent, block.loc.end.offset),
                }));
            }
            return result;
        }
        catch (error) {
            return this.createErrorResult(filePath, `解析エラー: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * 複数のVueファイルを一括解析
     */
    async analyzeFiles(filePaths, options = {}) {
        const results = [];
        for (const filePath of filePaths) {
            const result = await this.analyzeFile(filePath, options);
            results.push(result);
        }
        return results;
    }
    /**
     * スクリプトブロックを解析
     */
    parseScriptBlock(scriptBlock, fileContent) {
        return {
            content: scriptBlock.content,
            lang: scriptBlock.lang || 'javascript',
            setup: !!scriptBlock.setup,
            attrs: scriptBlock.attrs || {},
            startLine: this.getLineNumber(fileContent, scriptBlock.loc.start.offset),
            endLine: this.getLineNumber(fileContent, scriptBlock.loc.end.offset),
        };
    }
    /**
     * テンプレートブロックを解析
     */
    parseTemplateBlock(templateBlock, fileContent) {
        return {
            content: templateBlock.content,
            lang: templateBlock.lang || 'html',
            attrs: templateBlock.attrs || {},
            startLine: this.getLineNumber(fileContent, templateBlock.loc.start.offset),
            endLine: this.getLineNumber(fileContent, templateBlock.loc.end.offset),
        };
    }
    /**
     * スタイルブロックを解析
     */
    parseStyleBlock(styleBlock, fileContent) {
        return {
            content: styleBlock.content,
            lang: styleBlock.lang || 'css',
            scoped: !!styleBlock.scoped,
            module: styleBlock.module,
            attrs: styleBlock.attrs || {},
            startLine: this.getLineNumber(fileContent, styleBlock.loc.start.offset),
            endLine: this.getLineNumber(fileContent, styleBlock.loc.end.offset),
        };
    }
    /**
     * スクリプト内容をAST解析
     */
    async analyzeScriptContent(scriptContent, result, options) {
        try {
            // 一時的にスクリプト内容をファイルとして扱ってAST解析
            const astResult = await this.astParser.analyzeContent(scriptContent, result.filePath, {
                typescript: options.typescript || result.script?.lang === 'ts',
                jsx: options.jsx || false,
            });
            if (astResult.errors.length === 0) {
                result.imports.push(...astResult.imports);
                result.exports.push(...astResult.exports);
                result.definitions.push(...astResult.definitions);
                result.componentUsages.push(...astResult.componentUsages);
            }
        }
        catch (error) {
            console.warn(`スクリプト解析エラー: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * テンプレート内のコンポーネント使用を解析
     */
    analyzeTemplateComponents(templateContent, result) {
        // 簡単なregexベースの解析（後で改善可能）
        const componentRegex = /<([A-Z][a-zA-Z0-9-]*)/g;
        let match;
        let lineNumber = 1;
        const lines = templateContent.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            let match;
            while ((match = componentRegex.exec(line)) !== null) {
                const componentName = match[1];
                // props抽出（簡易版）
                const tagMatch = line.match(new RegExp(`<${componentName}[^>]*>`, 'g'));
                const props = [];
                if (tagMatch && tagMatch[0]) {
                    const propMatches = tagMatch[0].match(/(\w+)=/g);
                    if (propMatches) {
                        props.push(...propMatches.map((p) => p.slice(0, -1)));
                    }
                }
                result.componentUsages.push({
                    name: componentName,
                    props,
                    line: i + 1,
                });
            }
            // regex resetが必要
            componentRegex.lastIndex = 0;
        }
    }
    /**
     * ファイル内のオフセットから行番号を取得
     */
    getLineNumber(content, offset) {
        const beforeOffset = content.substring(0, offset);
        return beforeOffset.split('\n').length;
    }
    /**
     * エラー結果を作成
     */
    createErrorResult(filePath, error) {
        return {
            filePath,
            success: false,
            error,
            imports: [],
            exports: [],
            definitions: [],
            componentUsages: [],
            styles: [],
            customBlocks: [],
        };
    }
}
//# sourceMappingURL=vueSfcParser.js.map