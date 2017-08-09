import { Range } from 'vscode';

/**
 * CSSComb preset.
 */
export interface ICSSCombPreset {
	[prop: string]: any;
}

/**
 * The plugin settings.
 */
export interface IPluginSettings {
	preset?: string | ICSSCombPreset;
	ignoreFilesOnSave?: boolean;
	supportEmbeddedStyles?: boolean;
	formatOnSave?: boolean;
	syntaxAssociations?: Record<string, string>;
}

/**
 * The standard block of styles for processing.
 */
export interface IStyleBlock {
	range: Range;
	syntax: string;
	content: string;
	error: string;
	changed: boolean;
}

/**
 * The founded config by Config Profiler.
 */
export interface IFoundedConfig {
	from: string;
	config: object;
}
