import { fileScanner } from '../analyzer/fileScanner.js';
import { astParser } from '../analyzer/astParser.js';
import { VueSfcParser } from '../analyzer/vueSfcParser.js';
export class BaseAnalyzer {
    async analyzeProject(projectPath, options = {}) {
        const { maxDepth = 10, includeHidden = false, verbose = false } = options;
        if (verbose) {
            console.log(`🔍 プロジェクトを解析中: ${projectPath}`);
            console.log('📁 ファイルスキャン中...');
        }
        // ファイルスキャン
        const scanResult = await fileScanner.scanProject(projectPath, {
            maxDepth,
            includeHidden,
        });
        if (verbose) {
            console.log(`📊 ${scanResult.totalFiles} ファイルを発見 (${scanResult.scanDuration}ms)`);
        }
        // AST解析
        if (verbose) {
            console.log('🔍 AST解析中...');
        }
        const astBatchResult = await astParser.analyzeFiles(scanResult.files.map((f) => f.path));
        const astResults = astBatchResult.results;
        // Vue SFC解析
        const vueSfcParser = new VueSfcParser();
        const vueFiles = scanResult.files.filter((f) => f.path.endsWith('.vue'));
        const vueResults = vueFiles.length > 0
            ? await vueSfcParser.analyzeFiles(vueFiles.map((f) => f.path))
            : [];
        if (verbose) {
            console.log(`📊 AST解析: ${astBatchResult.successCount} 成功, ${astBatchResult.errorCount} エラー`);
            console.log(`📊 Vue解析: ${vueResults.filter((r) => r.success).length} 成功, ${vueResults.filter((r) => !r.success).length} エラー`);
        }
        return {
            scanResult,
            astResults,
            vueResults,
        };
    }
}
//# sourceMappingURL=baseAnalyzer.js.map