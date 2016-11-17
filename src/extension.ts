'use strict';

import * as path from 'path';
import * as os from 'os';

import * as vscode from 'vscode';
import * as multimatch from 'multimatch';
import * as detectIndent from 'detect-indent';

import * as fs from './lib/fs';

interface IConfiguration {
	preset: string | Object;
	ignoreFilesOnSave: string[];
	supportEmbeddedStyles: boolean;
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
let combConfig: ICombConfiguration;

let editorSettings: vscode.TextEditorOptions;
let editorConfiguration: IConfiguration;
let output: vscode.OutputChannel;

/**
 * Update CSSComb module version only if needed.
 *
 * @param {IConfiguration} config
 */
function requireCore(config: IConfiguration): void {
	const moduleVersion = config.useLatestCore ? '-next' : '';
	Comb = require(`csscomb${moduleVersion}`);
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
async function requireConfig(): Promise<ICombConfiguration> {
	// Update editorConfiguration
	editorConfiguration = vscode.workspace.getConfiguration().get<IConfiguration>('csscomb');

	// Standard (built-in) configs
	const builtInConfigs = ['csscomb', 'yandex', 'zen'];

	// Specified config
	if (typeof editorConfiguration.preset === 'string' && builtInConfigs.indexOf(editorConfiguration.preset) === -1) {
		let filepath = editorConfiguration.preset;
		if (osHomeDir && filepath.startsWith('~')) {
			filepath = filepath.replace(/^~($|\/|\\)/, `${osHomeDir}$1`);
		}

		if (vscode.workspace.rootPath && (editorConfiguration.preset.startsWith('./') || editorConfiguration.preset.startsWith('../'))) {
			filepath = path.resolve(vscode.workspace.rootPath, editorConfiguration.preset);
		}

		combConfig = await readConfig(filepath);
		return;
	}

	// Check workspace configuration
	const workspaceConfigFinds = await vscode.workspace.findFiles('**/*csscomb.json', '**∕node_modules∕**', 1);
	if (workspaceConfigFinds && workspaceConfigFinds.length !== 0) {
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

	combConfig = <ICombConfiguration>editorConfiguration.preset;
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

function searchEmbeddedStyles(document: vscode.TextDocument): { indent: string, range: vscode.Range } {
	if (document.languageId !== 'html') {
		return null;
	}

	const text = document.getText();

	let startTag = text.indexOf('<style>');
	let endTag = text.indexOf('</style>');

	if (startTag === -1 || endTag === -1) {
		return null;
	}

	let indent = '';
	let indentNumber = 0;
	let pos = startTag - 1;
	while (text[pos] !== '\n') {
		indent += text[pos];
		indentNumber++;
		pos--;
	}

	indent += detectIndent(text).indent;

	return {
		indent,
		range: new vscode.Range(document.positionAt(startTag + 8), document.positionAt(endTag - indentNumber))
	};
}

/**
 * Use CSSComb module.
 *
 * @param {vscode.TextDocument} document
 * @param {vscode.Selection} selection
 * @returns {Promise<IResult>}
 */
async function useComb(document: vscode.TextDocument, selection: vscode.Selection): Promise<IResult> {
	if (!isSupportedSyntax(document) && !editorConfiguration.supportEmbeddedStyles) {
		throw new Error('Cannot execute CSScomb because there is not style files. Supported: LESS, SCSS, SASS and CSS.');
	}

	// Require CSSComb module & configuration file
	await requireCore(editorConfiguration);

	if (!combConfig) {
		await requireConfig();
	}

	// If configuration is broken then show error and use standard configuration
	if (combConfig === 'syntaxError') {
		vscode.window.showErrorMessage('Provided JSON file contains syntax errors. Used standard configuration!');
		combConfig = {};
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

	let embeddedRange;
	let range;
	let text;
	if (syntax === 'html' && editorConfiguration.supportEmbeddedStyles) {
		embeddedRange = searchEmbeddedStyles(document);
		if (embeddedRange) {
			range = embeddedRange.range;
			text = document.getText(range);
			syntax = 'css';
		}
	} else if (!selection || (selection && selection.isEmpty)) {
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
		let result = await comb.processString(text, { syntax });

		if (embeddedRange && editorConfiguration.supportEmbeddedStyles && Object.keys(combConfig).length !== 0) {
			result = result.split('\n').map((x, index) => {
				if (index !== 0 && x !== '') {
					return embeddedRange.indent + x;
				}
				return x;
			}).join('\n');
		}

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
		editorSettings = textEditor.options;
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
			console.error(err);
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
			console.error(err);
		});

		event.waitUntil(Promise.all([edit]));
	});

	// Update configuration only if configuration file was is changed
	const workspaceWatcher = vscode.workspace.createFileSystemWatcher('**/*csscomb.json');
	workspaceWatcher.onDidCreate(() => requireConfig());
	workspaceWatcher.onDidDelete(() => requireConfig());
	workspaceWatcher.onDidChange(() => requireConfig());

	const configurationWatcher = vscode.workspace.onDidChangeConfiguration(() => requireConfig());

	// Subscriptions
	context.subscriptions.push(command);
	context.subscriptions.push(onSave);
	context.subscriptions.push(workspaceWatcher);
	context.subscriptions.push(configurationWatcher);
}
