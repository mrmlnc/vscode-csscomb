'use strict';

import * as path from 'path';

import * as vscode from 'vscode';
import * as micromatch from 'micromatch';

import { Config } from './services/config';
import { Comb } from './services/comb';

let output: vscode.OutputChannel;

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
	const comb = new Comb();

	const onCommand = vscode.commands.registerTextEditorCommand('csscomb.execute', (textEditor) => {
		config.scan().then((preset) => {
			comb.use(textEditor.document, textEditor.selection, preset).then((result) => {
				textEditor.edit((editBuilder) => {
					editBuilder.replace(result.range, result.css);
				});
			}).catch((err) => {
				showOutput(err.toString());
			});
		});
	});

	const onSave = vscode.workspace.onWillSaveTextDocument((event) => {
		const editorConfiguration = config.getEditorConfiguration();

		// Skip the formatting code without Editor configuration or if file not supported
		if (!editorConfiguration || !editorConfiguration.formatOnSave || !comb.checkSyntax(event.document)) {
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
				if (micromatch([currentFile], excludes).length !== 0) {
					return null;
				}
			}

			return comb.use(event.document, null, preset).then((result) => {
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
