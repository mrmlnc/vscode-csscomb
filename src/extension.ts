'use strict';

import * as path from 'path';

import * as vscode from 'vscode';
import * as multimatch from 'multimatch';
import * as detectIndent from 'detect-indent';

import { Config, IConfiguration } from './services/config';

let output: vscode.OutputChannel;

interface IResult {
	css: string;
	range: vscode.Range;
}

/**
 * Update CSSComb module version only if needed.
 *
 * @param {IConfiguration} config
 */
function requireCore(useLatestCore: boolean): any {
	const moduleVersion = useLatestCore ? '-next' : '';
	return require(`csscomb${moduleVersion}`);
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
async function useComb(document: vscode.TextDocument, selection: vscode.Selection, combConfig: any): Promise<IResult> {
	const editorConfiguration = vscode.workspace.getConfiguration().get<IConfiguration>('csscomb');

	if (!isSupportedSyntax(document) && !editorConfiguration.supportEmbeddedStyles) {
		throw new Error('Cannot execute CSScomb because there is not style files. Supported: LESS, SCSS, SASS and CSS.');
	}

	// Require CSSComb module & configuration file
	const Comb = await requireCore(editorConfiguration.useLatestCore);

	// If configuration is broken then show error and use standard configuration
	if (combConfig === 'syntaxError') {
		vscode.window.showErrorMessage('Provided JSON file contains syntax errors!');
		combConfig = {};
	}
	if (!combConfig) {
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

/**
 * Show message in iutput channel.
 *
 * @param {string} msg
 */
function showOutput(msg: string): void {
	if (!output) {
		output = vscode.window.createOutputChannel('CSSComb');
	}

	output.clear();
	output.appendLine('[CSSComb]\n');
	output.append(msg);
	output.show();
}

export function activate(context: vscode.ExtensionContext) {
	const config = new Config();

	const onCommand = vscode.commands.registerTextEditorCommand('csscomb.execute', (textEditor) => {
		config.scan().then((preset) => {
			useComb(textEditor.document, textEditor.selection, preset).then((result) => {
				textEditor.edit((editBuilder) => {
					editBuilder.replace(result.range, result.css);
				});
			}).catch((err) => {
				showOutput(err.toString());
			});
		});
	});

	const onSave = vscode.workspace.onWillSaveTextDocument((event) => {
		const editorConfiguration = vscode.workspace.getConfiguration().get<IConfiguration>('csscomb');
		// Skip the formatting code without Editor configuration or if file not supported
		if (!editorConfiguration || !editorConfiguration.formatOnSave || !isSupportedSyntax(event.document)) {
			return;
		}

		const edit = config.scan().then((preset) => {

			// Skip excluded files by Editor & CSSComb configuration file
			let excludes: string[] = [];
			if (editorConfiguration && editorConfiguration.ignoreFilesOnSave) {
				excludes = excludes.concat(editorConfiguration.ignoreFilesOnSave);
			}
			if (preset && preset.exclude) {
				excludes = excludes.concat(preset.exclude);
			}
			if (excludes.length !== 0) {
				const currentFile = path.relative(vscode.workspace.rootPath, event.document.fileName);
				if (multimatch([currentFile], excludes).length !== 0) {
					return;
				}
			}

			return useComb(event.document, null, preset).then((result) => {
				return vscode.TextEdit.replace(result.range, result.css);
			}).catch((err) => {
				showOutput(err.toString());
			});
		});

		event.waitUntil(Promise.all([edit]));
	});

	context.subscriptions.push(onCommand);
	context.subscriptions.push(onSave);
}
