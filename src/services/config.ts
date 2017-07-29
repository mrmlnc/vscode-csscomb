'use strict';

import * as path from 'path';
import * as os from 'os';

import * as vscode from 'vscode';
import { fileRead, fileExist } from '../utils/fs';

export interface IConfiguration {
	preset: string | Object;
	ignoreFilesOnSave: string[];
	supportEmbeddedStyles: boolean;
	formatOnSave: boolean;
	useLatestCore: boolean;
}

export interface ICombConfiguration {
	exclude?: string[];
}

export class Config {

	private builtConfigs = ['csscomb', 'yandex', 'zen'];
	private home = os.homedir();
	private root = vscode.workspace.rootPath;

	constructor() {
		// Code
	}

	public async scan(): Promise<ICombConfiguration> {
		const editorConfig = await this.getConfigFromEditor();
		if (editorConfig && Object.keys(editorConfig).length !== 0) {
			return editorConfig;
		}

		const workspaceConfig = await this.getConfigFromWorkspace();
		if (workspaceConfig) {
			return <ICombConfiguration>workspaceConfig;
		}

		const globalConfig = await this.getConfigFromUser();
		if (globalConfig) {
			return <ICombConfiguration>globalConfig;
		}

		return {};
	}

	/**
	 * Returns settings for CSSComb
	 */
	public getEditorConfiguration(): IConfiguration {
		return vscode.workspace.getConfiguration().get<IConfiguration>('csscomb');
	}

	/**
	 * Returns CSSComb config or 'syntaxError' if it broken.
	 */
	private readConfigurationFile(filepath: string): Promise<ICombConfiguration> {
		return fileRead(filepath).then((content) => {
			try {
				return JSON.parse(content);
			} catch (err) {
				return 'syntaxError';
			}
		});
	}

	/**
	 * Attempt to find the configuration in the Editor settings.
	 */
	private getConfigFromEditor() {
		const config = this.getEditorConfiguration();
		if (typeof config.preset !== 'string') {
			return Promise.resolve(config.preset);
		}
		if (typeof config.preset === 'string' && this.builtConfigs.indexOf(config.preset) !== -1) {
			return Promise.resolve(config.preset);
		}

		// Then csscomb.preset is filepath
		let filepath = config.preset;

		// Expand HOME directory within filepath
		if (config.preset.startsWith('~')) {
			filepath = config.preset.replace(/^~($|\/|\\)/, `${this.home}$1`);
		}

		// Expand relative path within filepath
		if (this.root && (config.preset.startsWith('./') || config.preset.startsWith('../'))) {
			filepath = path.resolve(this.root, config.preset);
		}

		return this.readConfigurationFile(filepath);
	}

	/**
	 * Attempt to find the configuration inside open workspace.
	 */
	private getConfigFromWorkspace(): Thenable<ICombConfiguration> {
		return vscode.workspace.findFiles('**/*csscomb.json', '**/node_modules/**').then((matches) => {
			if (!Array.isArray(matches) || (matches && matches.length === 0)) {
				return null;
			}

			return this.readConfigurationFile(matches[0].fsPath);
		});
	}

	/**
	 * Attempt to find the configuration inside user HOME directory.
	 */
	private getConfigFromUser(): Thenable<ICombConfiguration> {
		const filepathWithoutDot = path.join(this.home, 'csscomb.json');
		const filepathWithDot = path.join(this.home, '.csscomb.json');

		return Promise.all([
			fileExist(filepathWithoutDot),
			fileExist(filepathWithDot)
		]).then((result) => {
			if (!result[0] && !result[1]) {
				return null;
			}

			const filepath = result[0] ? filepathWithoutDot : filepathWithDot;
			return this.readConfigurationFile(filepath);
		});
	}

}
