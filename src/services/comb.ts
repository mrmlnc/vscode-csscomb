'use strict';

import * as vscode from 'vscode';
import * as detectIndent from 'detect-indent';

import { Config, IConfiguration } from './config';

export interface IResult {
	css: string;
	range: vscode.Range;
}

export interface ITextAndRange {
	text: string;
	range: vscode.Range;
	embeddedRange: IEmbeddedResult;
}

export interface IEmbeddedResult {
	indent: string;
	range: vscode.Range;
}

export class Comb {

	private combConstructor: any;
	private combVersion: string;
	private config = new Config();
	private settings: IConfiguration;

	private syntax: string;
	private document: vscode.TextDocument;
	private selection: vscode.Selection;
	private preset: any;

	constructor() {
		// Code
	}

	public async use(document: vscode.TextDocument, selection: vscode.Selection, preset: any): Promise<IResult> {
		// Update
		this.document = document;
		this.selection = selection;
		this.preset = preset;
		this.settings = this.config.getEditorConfiguration();

		// If it's not CSS and we don't support embedded styles
		if (!this.checkSyntax(this.document) && !this.settings.supportEmbeddedStyles) {
			throw new Error('Cannot execute CSScomb because there is not style files. Supported: LESS, SCSS, SASS and CSS.');
		}

		// Require CSSComb module & configuration file
		this.requireCore();

		// If configuration is broken then show error and use standard configuration
		if (this.preset === 'syntaxError') {
			vscode.window.showErrorMessage('Provided JSON file contains syntax errors!');
			this.preset = {};
		}
		if (!this.preset) {
			this.preset = {};
		}

		// If preset is string then get configuration from CSSComb module
		if (typeof this.preset === 'string') {
			this.preset = this.combConstructor.getConfig(this.preset);
		}

		// Creates instance of CSSComb
		const comb = new this.combConstructor();
		comb.configure(this.preset);

		this.syntax = this.document.languageId;
		if (/sass/.test(this.syntax)) {
			this.syntax = 'sass';
		}

		const content = this.getTextAndRange();

		try {
			let result = await comb.processString(content.text, { syntax: this.syntax });

			if (content.embeddedRange && this.settings.supportEmbeddedStyles && Object.keys(this.preset).length !== 0) {
				result = result.split('\n').map((x: string, index: number) => {
					if (index !== 0 && x !== '') {
						return content.embeddedRange.indent + x;
					}
					return x;
				}).join('\n');
			}

			return Promise.resolve({
				css: result,
				range: content.range
			});
		} catch (err) {
			return Promise.reject(err);
		}
	}

	public checkSyntax(document: vscode.TextDocument) {
		return /(css|less|scss|sass)/.test(document.languageId);
	}

	private requireCore() {
		let moduleVersion = 'csscomb';
		if (this.settings.useLatestCore) {
			moduleVersion += '-next';
		}

		if (moduleVersion !== this.combVersion) {
			this.combConstructor = require(moduleVersion);
			this.combVersion = moduleVersion;
		}
	}

	private getTextAndRange(): ITextAndRange {
		let embeddedRange;
		let range;
		let text;
		if (this.settings.supportEmbeddedStyles && this.isEmbeddedStyles(this.syntax)) {
			embeddedRange = this.searchEmbeddedStyles();
			if (embeddedRange) {
				range = embeddedRange.range;
				text = this.document.getText(range);
				this.syntax = 'css';
			}
		} else if (!this.selection || (this.selection && this.selection.isEmpty)) {
			const lastLine = this.document.lineAt(this.document.lineCount - 1);
			const start = new vscode.Position(0, 0);
			const end = new vscode.Position(this.document.lineCount - 1, lastLine.text.length);

			range = new vscode.Range(start, end);
			text = this.document.getText();
		} else {
			range = new vscode.Range(this.selection.start, this.selection.end);
			text = this.document.getText(range);
		}

		return {
			text,
			range,
			embeddedRange
		};
	}

	private isEmbeddedStyles(languageId: string): boolean {
		return ['html', 'vue', 'vue-html'].indexOf(languageId) !== -1;
	}

	private searchEmbeddedStyles(): IEmbeddedResult {
		if (!this.isEmbeddedStyles(this.document.languageId)) {
			return null;
		}

		const text = this.document.getText();

		const startTag = text.indexOf('<style>');
		const endTag = text.indexOf('</style>');

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

		indent += (<any>detectIndent(text)).indent;

		return {
			indent,
			range: new vscode.Range(this.document.positionAt(startTag + 8), this.document.positionAt(endTag - indentNumber))
		};
	}

}
