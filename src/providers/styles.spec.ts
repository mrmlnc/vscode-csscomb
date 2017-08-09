import * as assert from 'assert';

import * as proxyquire from 'proxyquire';

import StylesProvider from './styles';
import * as testUtils from '../test/utils';

import { IStyleBlock } from '../types';

const text = [
	'.text {',
	'  & > .nested {',
	'    content: ""',
	'  }',
	'}'
].join('\n');

describe('Providers → Styles', () => {
	// tslint:disable-next-line
	const Provider = proxyquire('./styles', {
		vscode: {
			Position: testUtils.Position,
			Range: testUtils.Range,
			'@noCallThru': true
		}
	}).default;

	const document = testUtils.mockupDocument(text);
	const provider: StylesProvider = new Provider(document, null, 'scss', null, '.tmp/test.scss', {
		preset: 'csscomb',
		syntaxAssociations: {}
	});

	it('should return true for supported syntax', () => {
		assert.ok(provider.isApplycable());
	});

	it('should return formated content', async () => {
		const expected: IStyleBlock[] = <any>[{
			syntax: 'scss',
			range: {
				start: { line: 0, character: 0 },
				end: { line: 4, character: 1 }
			},
			content: '.text\n{\n    & > .nested\n    {\n        content: \'\';\n    }\n}\n',
			error: null,
			changed: true
		}];

		const actual = await provider.format();

		assert.deepEqual(actual, expected);
	});
});
