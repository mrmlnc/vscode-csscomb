'use strict';

const path = require('path');
const fs = require('fs');
const userHome = require('os').homedir();
const co = require('co');
const vscode = require('vscode');
const Comb = require('csscomb');

function searchGlobalConfig() {
	return new Promise((resolve) => {
		fs.stat(path.join(userHome, '.csscomb.json'), (err) => {
			resolve(!err);
		});
	});
}

function searchWorkspaceConfig() {
	return new Promise((resolve) => {
		vscode.workspace.findFiles('**/*csscomb.json', '{**/node_modules/**,**/bower_components/**}', 1)
			.then((fileName) => resolve(fileName));
	});
}

function getConfig(fileName) {
	return new Promise((resolve) => {
		vscode.workspace.openTextDocument(fileName)
			.then((fileData) => {
				try {
					const json = JSON.parse(fileData.getText());
					resolve(json);
				} catch (err) {
					vscode.window.showErrorMessage('Provided JSON file contains syntax errors. Used standard configuration!');
					resolve(null);
				}
			});
	});
}

function isSupportedSyntax(ext) {
	return /(css|less|scss|sass|sass-indented)/.test(ext);
}

function useComb(document, config) {
	if (!config) {
		config = 'csscomb';
	}

	if (typeof config === 'string') {
		config = Comb.getConfig(config);
	}

	const comb = new Comb();
	comb.configure(config);

	let syntax = document.languageId || document._languageId;
	if (syntax === 'sass-indented') {
		syntax = 'sass';
	}

	try {
		return comb.processString(document.getText(), { syntax: syntax });
	} catch (err) {
		// For VS Code API: Sass === Scss
		if (err.syntax === 'sass') {
			return comb.processString(document.getText(), { syntax: 'scss' });
		}

		vscode.window.showErrorMessage(err);
	}
}

function init(document, onDidSaveStatus) {
	let combConfig;

	if (!isSupportedSyntax(document.languageId)) {
		console.error('Cannot execute CSScomb because there is not style files. Supported: LESS, SCSS, SASS and CSS.');
		return;
	}

	co(function* () {
		const workspaceConfigStatus = yield searchWorkspaceConfig();
		if (workspaceConfigStatus && workspaceConfigStatus.length) {
			combConfig = yield getConfig(workspaceConfigStatus[0]);
			return useComb(document, combConfig);
		}

		const globalConfigStatus = yield searchGlobalConfig();
		if (globalConfigStatus) {
			combConfig = yield getConfig(path.join(userHome, '.csscomb.json'));
			return useComb(document, combConfig);
		}

		combConfig = vscode.workspace.getConfiguration('csscomb').preset;
		return useComb(document, combConfig);
	}).then((combedStyles) => {
		const editor = vscode.editor || vscode.window.activeTextEditor;
		if (!editor) {
			throw new Error('Ooops...');
		}

		const document = editor.document;
		const lastLine = document.lineAt(document.lineCount - 1);
		const start = new vscode.Position(0, 0);
		const end = new vscode.Position(document.lineCount - 1, lastLine.text.length);
		const range = new vscode.Range(start, end);

		if (document.csscomb) {
			delete document.csscomb;
			return;
		}

		if (onDidSaveStatus) {
			const we = new vscode.WorkspaceEdit();
			we.replace(document.uri, range, combedStyles);
			document.csscomb = true;
			vscode.workspace.applyEdit(we).then(() => {
				document.save();
			});
		} else {
			editor.edit((builder) => {
				builder.replace(range, combedStyles);
			});
		}
	}).catch((err) => {
		console.error(err);
	});
}

function activate(context) {
	const processEditor = vscode.commands.registerTextEditorCommand('csscomb.processEditor', (textEditor) => {
		init(textEditor.document, false);
	});

	context.subscriptions.push(processEditor);

	const onSave = vscode.workspace.onDidSaveTextDocument((document) => {
		const onDidSave = vscode.workspace.getConfiguration('csscomb').autoFormatOnSave;
		if (onDidSave) {
			init(document, true);
		}
	});

	context.subscriptions.push(onSave);
}

exports.activate = activate;
