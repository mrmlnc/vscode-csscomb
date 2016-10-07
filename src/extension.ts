'use strict';

import * as path from 'path';
import * as os from 'os';

import * as multimatch from 'multimatch';
import * as vscode from 'vscode';

import * as fs from './lib/fs';

interface IConfiguration {
	preset: string | Object;
	ignoreFilesOnSave: string[];
	formatOnSave: boolean;
	useLatestCore: boolean;
}

interface ICombConfiguration {
	exclude?: string[];
}

interface IResult {
	css: string;
	range: vscode.Range;
}

// "global" variables
const osHomeDir = os.homedir();
let Comb;
let combVersion = '';
let combConfig: ICombConfiguration;

let editorConfiguration: IConfiguration;
let output: vscode.OutputChannel;

/**
 * Update CSSComb module version only if needed.
 *
 * @param {IConfiguration} config
 */
function requireCore(config: IConfiguration): void {
	const moduleVersion = config.useLatestCore ? '-next' : '';

	if (combVersion !== moduleVersion) {
		delete require.cache[require.resolve(`csscomb${combVersion}`)];
	}

	Comb = require(`csscomb${moduleVersion}`);
	combVersion = moduleVersion;
}

/**
 * Read CSSComb configuration file.
 *
 * @param {string} filepath
 * @returns {Promise<any>}
 */
function readConfig(filepath: string): Promise<any> {
	return fs.fileRead(filepath).then((data) => {
		try {
			return JSON.parse(data);
		} catch (err) {
			return 'syntaxError';
		}
	});
}

/**
 * Update CSSComb configuration only if needed.
 *
 * @param {IConfiguration} config
 */
async function requireConfig(config: IConfiguration): Promise<ICombConfiguration> {
	// Update editorConfiguration
	editorConfiguration = vscode.workspace.getConfiguration().get<IConfiguration>('csscomb');

	// Check workspace configuration
	const workspaceConfigFinds = await vscode.workspace.findFiles('**/*csscomb.json', '**∕node_modules∕**', 1);
	if (workspaceConfigFinds.length !== 0) {
		combConfig = await readConfig(workspaceConfigFinds[0].fsPath);
		return;
	}

	// Check global configuration
	const globalConfigPath = path.join(osHomeDir, '.csscomb.json');
	const globalConfigFinds = await fs.fileExist(globalConfigPath);
	if (globalConfigFinds) {
		combConfig = await readConfig(globalConfigPath);
		return;
	}

	combConfig = <ICombConfiguration>config.preset;
}

/**
 * Check syntax support.
 *
 * @param {any} ext
 * @returns {boolean}
 */
function isSupportedSyntax(document: vscode.TextDocument): boolean {
	return /(css|less|scss|sass)/.test(document.languageId);
}

/**
 * Use CSSComb module.
 *
 * @param {vscode.TextDocument} document
 * @param {vscode.Selection} selection
 * @returns {Promise<IResult>}
 */
async function useComb(document: vscode.TextDocument, selection: vscode.Selection): Promise<IResult> {
	if (!isSupportedSyntax(document)) {
		console.error('Cannot execute CSScomb because there is not style files. Supported: LESS, SCSS, SASS and CSS.');
		return;
	}

	// Require CSSComb module & configuration file
	await requireCore(editorConfiguration);

	if (!combConfig) {
		await requireConfig(editorConfiguration);
	}

	// If configuration is broken then show error and use standard configuration
	if (combConfig === 'syntaxError') {
		vscode.window.showErrorMessage('Provided JSON file contains syntax errors. Used standard configuration!');
		combConfig = 'csscomb';
	}

	// If preset is string then get configuration from CSSComb module
	if (typeof combConfig === 'string') {
		combConfig = Comb.getConfig(combConfig);
	}

	const comb = new Comb();
	comb.configure(combConfig);

	let syntax = document.languageId;
	if (/sass/.test(syntax)) {
		syntax = 'sass';
	}

	let range;
	let text;
	if (!selection || (selection && selection.isEmpty)) {
		const lastLine = document.lineAt(document.lineCount - 1);
		const start = new vscode.Position(0, 0);
		const end = new vscode.Position(document.lineCount - 1, lastLine.text.length);

		range = new vscode.Range(start, end);
		text = document.getText();
	} else {
		range = new vscode.Range(selection.start, selection.end);
		text = document.getText(range);
	}

	try {
		const result = comb.processString(document.getText(), { syntax });

		return {
			css: result,
			range
		};
	} catch (err) {
		throw err;
	}
}

export function activate(context: vscode.ExtensionContext) {
	editorConfiguration = vscode.workspace.getConfiguration().get<IConfiguration>('csscomb');

	const command = vscode.commands.registerTextEditorCommand('csscomb.execute', (textEditor) => {
		useComb(textEditor.document, textEditor.selection).then((result) => {
			textEditor.edit((editBuilder) => {
				editBuilder.replace(result.range, result.css);
			});
		}).catch((err) => {
			if (!output) {
				output = vscode.window.createOutputChannel('CSSComb');
			}

			output.clear();
			output.append(err.toString());
			output.show();
		});
	});

	const onSave = vscode.workspace.onWillSaveTextDocument((event) => {
		// Skip the formatting code without Editor configuration or if file not supported
		if (!editorConfiguration || !editorConfiguration.formatOnSave || !isSupportedSyntax(event.document)) {
			return;
		}

		// Skip excluded files by Editor & CSSComb configuration file
		let excludes: string[] = [];
		if (editorConfiguration && editorConfiguration.ignoreFilesOnSave) {
			excludes = excludes.concat(editorConfiguration.ignoreFilesOnSave);
		}
		if (combConfig && combConfig.exclude) {
			excludes = excludes.concat(combConfig.exclude);
		}
		if (excludes.length !== 0) {
			const currentFile = path.relative(vscode.workspace.rootPath, event.document.fileName);
			if (multimatch([currentFile], excludes).length !== 0) {
				return;
			}
		}

		const edit = useComb(event.document, null).then((result) => {
			return vscode.TextEdit.replace(result.range, result.css);
		}).catch((err) => {
			if (!output) {
				output = vscode.window.createOutputChannel('CSSComb');
			}

			output.clear();
			output.append(err.toString());
			output.show();
		});

		event.waitUntil(Promise.all([edit]));
	});

	// Update configuration only if configuration file was is changed
	const workspaceWatcher = vscode.workspace.createFileSystemWatcher('**/*csscomb.json');
	workspaceWatcher.onDidCreate(() => requireConfig(editorConfiguration));
	workspaceWatcher.onDidDelete(() => requireConfig(editorConfiguration));
	workspaceWatcher.onDidChange(() => requireConfig(editorConfiguration));

	const configurationWatcher = vscode.workspace.onDidChangeConfiguration(() => requireConfig(editorConfiguration));

	// Subscriptions
	context.subscriptions.push(command);
	context.subscriptions.push(onSave);
	context.subscriptions.push(workspaceWatcher);
	context.subscriptions.push(configurationWatcher);
}
