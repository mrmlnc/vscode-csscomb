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

interface ICombConfiguration {
	exclude?: string[];
}

export class Config {

	private builtConfigs = ['csscomb', 'yandex', 'zen'];
	private home = os.homedir();
	private root = vscode.workspace.rootPath;

	constructor() {
		// code
	}

	public async scan() {
		const editorConfig = await this.getConfigFromEditor();
		if (editorConfig) {
			return editorConfig;
		}

		const workspaceConfog = await this.getConfigFromWorkspace();
		if (workspaceConfog) {
			return workspaceConfog;
		}

		const globalConfig = await this.getConfigFromUser();
		if (globalConfig) {
			return globalConfig;
		}

		return null;
	}

	private readConfigurationFile(filepath: string): Promise<ICombConfiguration> {
		return fileRead(filepath).then((content) => {
			try {
				return JSON.parse(content);
			} catch (err) {
				return 'syntaxError';
			}
		});
	}

	private getEditorConfiguration(): IConfiguration {
		return vscode.workspace.getConfiguration().get<IConfiguration>('csscomb');
	}

	private getConfigFromEditor() {
		const config = this.getEditorConfiguration();
		if (typeof config.preset !== 'string') {
			return null;
		}
		if (this.builtConfigs.indexOf(config.preset) !== -1) {
			return Promise.resolve(config.preset);
		}

		let filepath = config.preset;
		if (config.preset.startsWith('~')) {
			filepath = config.preset.replace(/^~($|\/|\\)/, `${this.home}$1`);
		}
		if (this.root && (config.preset.startsWith('./') || config.preset.startsWith('../'))) {
			filepath = path.resolve(this.root, config.preset);
		}
		return this.readConfigurationFile(filepath);
	}

	private getConfigFromWorkspace(): Thenable<IConfiguration> {
		return vscode.workspace.findFiles('**/*csscomb.json', '**/node_modules/**').then((matches) => {
			if (!Array.isArray(matches) || (matches && matches.length === 0)) {
				return null;
			}

			return this.readConfigurationFile(matches[0].fsPath);
		});
	}

	private getConfigFromUser(): Thenable<IConfiguration> {
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
