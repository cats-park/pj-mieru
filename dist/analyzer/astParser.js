import * as ts from 'typescript';
import { promises as fs } from 'fs';
import path from 'path';
/**
 * JavaScript/TypeScript AST解析クラス
 */
export class AstParser {
    /**
     * ファイルの内容を解析してAST情報を抽出
     */
    async analyzeFile(filePath, options = {}) {
        const startTime = Date.now();
        const result = {
            filePath,
            relativePath: path.relative(process.cwd(), filePath),
            language: this.detectLanguage(filePath),
            imports: [],
            componentUsages: [],
            definitions: [],
            exports: [],
            errors: [],
            parseTime: 0,
        };
        try {
            // ファイル読み込み
            const content = await fs.readFile(filePath, 'utf-8');
            // TypeScript compiler API でAST生成
            const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true, this.getScriptKind(filePath));
            // AST解析実行
            this.visitNode(sourceFile, result);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error';
            result.errors.push(errorMessage);
        }
        result.parseTime = Date.now() - startTime;
        return result;
    }
    /**
     * 複数ファイルの一括解析
     */
    async analyzeFiles(filePaths, options = {}) {
        const startTime = Date.now();
        const results = [];
        for (const filePath of filePaths) {
            const result = await this.analyzeFile(filePath, options);
            results.push(result);
        }
        const successCount = results.filter((r) => r.errors.length === 0).length;
        const errorCount = results.filter((r) => r.errors.length > 0).length;
        return {
            results,
            totalFiles: filePaths.length,
            successCount,
            errorCount,
            totalTime: Date.now() - startTime,
        };
    }
    /**
     * 文字列コンテンツを解析（Vue SFC用）
     */
    async analyzeContent(content, virtualPath, options = {}) {
        const startTime = Date.now();
        try {
            const result = {
                filePath: virtualPath,
                relativePath: virtualPath,
                language: this.detectLanguage(virtualPath),
                imports: [],
                componentUsages: [],
                definitions: [],
                exports: [],
                errors: [],
                parseTime: 0,
            };
            // TypeScriptでソースファイルを作成
            const sourceFile = ts.createSourceFile(virtualPath, content, ts.ScriptTarget.Latest, true, this.getScriptKind(virtualPath));
            // ASTを解析
            this.visitNode(sourceFile, result);
            result.parseTime = Date.now() - startTime;
            return result;
        }
        catch (error) {
            const result = {
                filePath: virtualPath,
                relativePath: virtualPath,
                language: this.detectLanguage(virtualPath),
                imports: [],
                componentUsages: [],
                definitions: [],
                exports: [],
                errors: [error instanceof Error ? error.message : String(error)],
                parseTime: Date.now() - startTime,
            };
            return result;
        }
    }
    /**
     * ファイル拡張子から言語を検出
     */
    detectLanguage(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        const extToLanguage = {
            '.ts': 'typescript',
            '.tsx': 'typescript',
            '.js': 'javascript',
            '.jsx': 'javascript',
            '.vue': 'vue',
        };
        return extToLanguage[ext] || 'unknown';
    }
    /**
     * ファイル拡張子からScriptKindを決定
     */
    getScriptKind(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        switch (ext) {
            case '.ts':
                return ts.ScriptKind.TS;
            case '.tsx':
                return ts.ScriptKind.TSX;
            case '.jsx':
                return ts.ScriptKind.JSX;
            case '.js':
            default:
                return ts.ScriptKind.JS;
        }
    }
    /**
     * ASTノードを再帰的に訪問
     */
    visitNode(node, result) {
        // インポート文の処理
        if (ts.isImportDeclaration(node)) {
            this.extractImport(node, result);
        }
        // エクスポート文の処理
        if (ts.isExportDeclaration(node) || ts.isExportAssignment(node)) {
            this.extractExport(node, result);
        }
        // 関数定義の処理
        if (ts.isFunctionDeclaration(node)) {
            this.extractFunctionDefinition(node, result);
        }
        // 変数定義の処理
        if (ts.isVariableStatement(node)) {
            this.extractVariableDefinitions(node, result);
        }
        // クラス定義の処理
        if (ts.isClassDeclaration(node)) {
            this.extractClassDefinition(node, result);
        }
        // JSX要素の処理
        if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
            this.extractJsxUsage(node, result);
        }
        // 子ノードを再帰的に処理
        ts.forEachChild(node, (child) => this.visitNode(child, result));
    }
    /**
     * インポート文を抽出
     */
    extractImport(node, result) {
        if (!node.moduleSpecifier || !ts.isStringLiteral(node.moduleSpecifier)) {
            return;
        }
        const source = node.moduleSpecifier.text;
        const line = this.getLineNumber(node);
        if (!node.importClause) {
            // side-effect import: import './styles.css'
            result.imports.push({
                type: 'side-effect',
                name: '',
                source,
                line,
            });
            return;
        }
        const { importClause } = node;
        // default import
        if (importClause.name) {
            result.imports.push({
                type: 'default',
                name: importClause.name.text,
                source,
                line,
            });
        }
        // named imports
        if (importClause.namedBindings) {
            if (ts.isNamespaceImport(importClause.namedBindings)) {
                // namespace import: import * as React from 'react'
                result.imports.push({
                    type: 'namespace',
                    name: importClause.namedBindings.name.text,
                    source,
                    line,
                });
            }
            else if (ts.isNamedImports(importClause.namedBindings)) {
                // named imports: import { useState, useEffect } from 'react'
                importClause.namedBindings.elements.forEach((element) => {
                    result.imports.push({
                        type: 'named',
                        name: element.name.text,
                        source,
                        line,
                        original: element.propertyName?.text,
                    });
                });
            }
        }
    }
    /**
     * エクスポート文を抽出
     */
    extractExport(node, result) {
        const line = this.getLineNumber(node);
        if (ts.isExportAssignment(node)) {
            // export = ...
            result.exports.push({
                type: 'default',
                name: 'default',
                line,
            });
        }
        else if (node.exportClause && ts.isNamedExports(node.exportClause)) {
            // export { name1, name2 }
            node.exportClause.elements.forEach((element) => {
                result.exports.push({
                    type: 'named',
                    name: element.name.text,
                    line,
                });
            });
        }
    }
    /**
     * 関数定義を抽出
     */
    extractFunctionDefinition(node, result) {
        if (!node.name)
            return;
        const name = node.name.text;
        const line = this.getLineNumber(node);
        const isExported = this.hasExportModifier(node);
        result.definitions.push({
            type: 'function',
            name,
            line,
            exported: isExported,
            exportType: isExported ? 'named' : undefined,
        });
        // エクスポートされている場合はexportsにも追加
        if (isExported) {
            result.exports.push({
                type: 'named',
                name,
                line,
            });
        }
    }
    /**
     * 変数定義を抽出
     */
    extractVariableDefinitions(node, result) {
        const line = this.getLineNumber(node);
        const isExported = this.hasExportModifier(node);
        node.declarationList.declarations.forEach((declaration) => {
            if (ts.isIdentifier(declaration.name)) {
                const name = declaration.name.text;
                result.definitions.push({
                    type: 'variable',
                    name,
                    line,
                    exported: isExported,
                    exportType: isExported ? 'named' : undefined,
                });
                // エクスポートされている場合はexportsにも追加
                if (isExported) {
                    result.exports.push({
                        type: 'named',
                        name,
                        line,
                    });
                }
            }
        });
    }
    /**
     * クラス定義を抽出
     */
    extractClassDefinition(node, result) {
        if (!node.name)
            return;
        const name = node.name.text;
        const line = this.getLineNumber(node);
        const isExported = this.hasExportModifier(node);
        const isDefaultExport = this.hasDefaultExportModifier(node);
        result.definitions.push({
            type: 'class',
            name,
            line,
            exported: isExported || isDefaultExport,
            exportType: isDefaultExport
                ? 'default'
                : isExported
                    ? 'named'
                    : undefined,
        });
        // エクスポートされている場合はexportsにも追加
        if (isExported) {
            result.exports.push({
                type: 'named',
                name,
                line,
            });
        }
        else if (isDefaultExport) {
            result.exports.push({
                type: 'default',
                name,
                line,
            });
        }
    }
    /**
     * JSX要素を抽出
     */
    extractJsxUsage(node, result) {
        const line = this.getLineNumber(node);
        let tagName;
        let attributes;
        if (ts.isJsxElement(node)) {
            const openingElement = node.openingElement;
            if (!ts.isIdentifier(openingElement.tagName))
                return;
            tagName = openingElement.tagName.text;
            attributes = openingElement.attributes;
        }
        else {
            // JsxSelfClosingElement
            if (!ts.isIdentifier(node.tagName))
                return;
            tagName = node.tagName.text;
            attributes = node.attributes;
        }
        // 大文字で始まる場合はカスタムコンポーネント
        if (tagName[0] === tagName[0].toUpperCase()) {
            const props = attributes.properties
                .filter((prop) => ts.isJsxAttribute(prop))
                .map((prop) => (ts.isIdentifier(prop.name) ? prop.name.text : ''))
                .filter((name) => name !== '');
            result.componentUsages.push({
                name: tagName,
                props,
                line,
            });
        }
    }
    /**
     * ノードの行番号を取得
     */
    getLineNumber(node) {
        const sourceFile = node.getSourceFile();
        if (!sourceFile)
            return 0;
        const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        return line + 1; // 1-based line number
    }
    /**
     * exportモディファイアが付いているかチェック
     */
    hasExportModifier(node) {
        return 'modifiers' in node && Array.isArray(node.modifiers)
            ? node.modifiers.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
            : false;
    }
    /**
     * export defaultモディファイアが付いているかチェック
     */
    hasDefaultExportModifier(node) {
        return 'modifiers' in node && Array.isArray(node.modifiers)
            ? node.modifiers.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) &&
                node.modifiers.some((modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword)
            : false;
    }
}
export const astParser = new AstParser();
//# sourceMappingURL=astParser.js.map