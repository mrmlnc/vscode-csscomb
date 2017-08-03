import * as assert from 'assert';

import * as proxyquire from 'proxyquire';

import EmbeddedProvider from './embedded';
import * as testUtils from '../test/utils';

import { IStyleBlock } from '../types';

const text = [
	'<template>',
	'  <style scoped lang="less">',
	'    .test {',
	'      & > .nested {',
	'        content: ""',
	'      }',
	'    }',
	'  </style>',
	'</template>',
	'<template>',
	'	<style>',
	'		.test {',
	'			content: ""',
	'		}',
	'	</style>',
	'</template>'
].join('\n');

describe('Providers → Embedded', () => {
	// tslint:disable-next-line
	const Provider = proxyquire('./embedded', {
		vscode: {
			Position: testUtils.Position,
			Range: testUtils.Range,
			'@noCallThru': true
		}
	}).default;

	const document = testUtils.mockupDocument(text);
	const provider: EmbeddedProvider = new Provider(document, 'html', null, '.tmp/test.html', {
		preset: 'csscomb'
	});

	it('should return true for supported syntax', () => {
		assert.ok(provider.isApplycable());
	});

	it('should return formated content', async () => {
		const expected: IStyleBlock[] = <any>[
			{
				syntax: 'less',
				content: '    .test\n    {\n        & > .nested\n        {\n            content: \'\';\n        }\n    }\n',
				range: {
					start: { line: 0, character: 40 },
					end: { line: 0, character: 105 }
				},
				error: null
			},
			{
				syntax: 'css',
				content: '\t\t.test\n\t\t{\n\t\t    content: \'\';\n\t\t}\n',
				range: {
					start: { line: 0, character: 149 },
					end: { line: 0, character: 177 }
				},
				error: null
			}
		];

		const actual = await provider.format();

		assert.deepEqual(actual, expected);
	});
});
