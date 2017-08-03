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
}

/**
 * The standard block of styles for processing.
 */
export interface IStyleBlock {
	range: Range;
	syntax: string;
	content: string;
	error: string;
}

/**
 * The founded config by Config Profiler.
 */
export interface IFoundedConfig {
	from: string;
	config: object;
}
