import BaseProvider from './base';

import * as vscode from 'vscode';

import { IPluginSettings, IStyleBlock } from '../types';

export interface IStyleBlock {
	syntax: string;
	content: string;
	range: [number, number];
}

export default class EmbeddedProvider extends BaseProvider {
	constructor(
		private readonly document: vscode.TextDocument,
		public readonly syntax: string,
		workspace: string, filepath: string, settings: IPluginSettings
	) {
		super(workspace, filepath, syntax, settings);
	}

	public getBlocks(): IStyleBlock[] {
		const text: string = this.document.getText();

		let pos: number = 0;
		let char: string;

		const blocks: IStyleBlock[] = [];

		let syntax: string = 'css';
		let content: string;

		let blockStartIndex: number = -1;

		while (pos < text.length) {
			char = text.charAt(pos);

			// Find start position of opening STYLE tag.
			if (char === '<' && text.substr(pos, 6) === '<style') {
				// Combine all char's to tag
				let tag: string = '';
				do {
					char = text.charAt(pos);

					tag += char;

					pos++;
				} while (char !== '>' && pos < text.length);

				// We trying support language's defined in the style tag
				const matchedSyntax = tag.match(/lang=['"](.+)?['"]/);

				syntax = this.getSyntax(matchedSyntax ? matchedSyntax[1] : 'css');

				blockStartIndex = pos + 1;
			}

			// Find end position of closing STYLE tag.
			if (char === '<' && text.substr(pos, 8) === '</style>') {
				// Find first newline symbol for the current style tag
				let previous = pos;

				do {
					char = text.charAt(previous);

					previous--;
				} while (char !== '\n' && previous >= 0);

				const blockEndIndex = pos - (pos - previous - 1);

				content = text.substring(blockStartIndex, blockEndIndex);

				const start = this.document.positionAt(blockStartIndex);
				const end = this.document.positionAt(blockEndIndex);

				blocks.push({
					syntax,
					content,
					range: new vscode.Range(start, end),
					error: null,
					changed: false
				});

				pos += 8;
			}

			pos++;
		}

		return blocks;
	}

	public async format(): Promise<IStyleBlock[]> {
		const blocks = await super.format();

		blocks.forEach((block) => {
			const lines = block.content.split(/\r?\n/);

			const indent = lines[0].match(/^([\s]*)/g);
			if (!indent || !block.changed) {
				return;
			}

			block.content = lines.map((line, index) => {
				if (index !== 0 && line !== '') {
					return indent + line;
				}

				return line;
			}).join('\n');
		});

		return blocks;
	}

	public supportedSyntaxes(): string[] {
		return ['html', 'htm', 'vue', 'vue-html'];
	}
}
