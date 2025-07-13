export interface MieruConfig {
    openaiApiKey?: string;
    defaultFramework?: string;
    maxDepth?: number;
    ignorePatterns?: string[];
    includeExternalLibraries?: boolean;
}
export declare class ConfigManager {
    private static configPath;
    static getApiKey(cliApiKey?: string): Promise<string>;
    static loadConfig(): Promise<MieruConfig>;
    static saveConfig(config: MieruConfig): Promise<void>;
    static setupInteractive(): Promise<void>;
    static validateApiKey(apiKey: string): Promise<boolean>;
}
//# sourceMappingURL=config.d.ts.map