import BaseProvider from './base';

import * as vscode from 'vscode';

import { IPluginSettings, IStyleBlock } from '../types';

export default class StylesProvider extends BaseProvider {
	constructor(
		private document: vscode.TextDocument,
		private selection: vscode.Selection,
		public syntax: string,
		workspace: string, filepath: string, settings: IPluginSettings
	) {
		super(workspace, filepath, syntax, settings);
	}

	public getBlocks(): IStyleBlock[] {
		let range: vscode.Range;
		let content: string;

		if (!this.selection || (this.selection && this.selection.isEmpty)) {
			const lastLine = this.document.lineAt(this.document.lineCount - 1);
			const start = new vscode.Position(0, 0);
			const end = new vscode.Position(this.document.lineCount - 1, lastLine.text.length);

			range = new vscode.Range(start, end);
			content = this.document.getText();
		} else {
			range = new vscode.Range(this.selection.start, this.selection.end);
			content = this.document.getText(range);
		}

		return [{ syntax: this.syntax, range, content, error: null }];
	}

	public supportedSyntaxes(): string[] {
		return ['css', 'less', 'scss', 'sass', 'sass-indented'];
	}
}
