import * as path from 'path';

import * as vscode from 'vscode';
import * as micromatch from 'micromatch';

import StylesProvider from './providers/styles';
import EmbeddedProvider from './providers/embedded';

import { IPluginSettings } from './types';

let output: vscode.OutputChannel;

/**
 * Show message in iutput channel.
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

function getProvider(document: vscode.TextDocument, selection: vscode.Selection, workspace: string, filepath: string, settings: IPluginSettings) {
	const stylesProvider = new StylesProvider(document, selection, document.languageId, workspace, filepath, settings);
	const embeddedProvider = new EmbeddedProvider(document, document.languageId, workspace, filepath, settings);

	if (stylesProvider.isApplycable()) {
		return stylesProvider;
	} else if (embeddedProvider.isApplycable()) {
		return embeddedProvider;
	}

	return null;
}

export function activate(context: vscode.ExtensionContext) {
	const onCommand = vscode.commands.registerTextEditorCommand('csscomb.execute', (textEditor) => {
		// Prevent run command without active TextEditor
		if (!vscode.window.activeTextEditor) {
			return null;
		}

		const document = textEditor.document;
		const selection = textEditor.selection;
		const filepath = document.uri.fsPath;
		const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
		// Use workspace directory or filepath of current file as workspace folder
		const workspace = workspaceFolder ? workspaceFolder.uri.fsPath : filepath;
		const workspaceUri = workspaceFolder ? workspaceFolder.uri : null;
		const settings = vscode.workspace.getConfiguration('csscomb', workspaceUri) as IPluginSettings;

		const provider = getProvider(document, selection, workspace, filepath, settings);

		if (!provider) {
			return showOutput(`We do not support "${document.languageId}" syntax.`);
		}

		provider.format().then((blocks) => {
			textEditor.edit((builder) => {
				blocks.forEach((block) => {
					if (block.error) {
						showOutput(block.error.toString());
					}

					builder.replace(block.range, block.content);
				});
			});
		}).catch((err: Error) => showOutput(err.stack));
	});

	const onSave = vscode.workspace.onWillSaveTextDocument((event) => {
		// Prevent run command without active TextEditor
		if (!vscode.window.activeTextEditor) {
			return null;
		}

		const document = event.document;
		const filepath = document.uri.fsPath;
		const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
		// Use workspace directory or filepath of current file as workspace folder
		const workspace = workspaceFolder ? workspaceFolder.uri.fsPath : filepath;
		const workspaceUri = workspaceFolder ? workspaceFolder.uri : null;
		const settings = vscode.workspace.getConfiguration('csscomb', workspaceUri) as IPluginSettings;

		// Skip files without providers
		const provider = getProvider(document, null, workspace, filepath, settings);

		// Skip the formatting code without Editor configuration
		if (!settings || !settings.formatOnSave || !provider) {
			return null;
		}

		// Skip excluded files by Editor & CSSComb configuration file
		let excludes: string[] = [];
		if (settings && settings.ignoreFilesOnSave) {
			excludes = excludes.concat(<any>settings.ignoreFilesOnSave);
		}
		if (typeof settings.preset === 'object' && settings.preset.exclude) {
			excludes = excludes.concat(settings.preset.exclude);
		}
		if (excludes.length !== 0) {
			const currentFile = path.relative(vscode.workspace.rootPath, event.document.fileName);
			if (micromatch([currentFile], excludes).length !== 0) {
				return null;
			}
		}

		const actions = provider.format().then((blocks) => {
			vscode.window.activeTextEditor.edit((builder) => {
				blocks.forEach((block) => {
					if (block.error) {
						showOutput(block.error.toString());
					}
					builder.replace(block.range, block.content);
				});
			});
		}).catch((err: Error) => showOutput(err.stack));

		event.waitUntil(actions);
	});

	context.subscriptions.push(onCommand);
	context.subscriptions.push(onSave);
}
