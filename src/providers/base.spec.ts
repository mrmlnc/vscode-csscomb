import * as assert from 'assert';

import BaseProvider from './base';

import { IStyleBlock } from '../types';

class TestBaseProvider extends BaseProvider {
	public supportedSyntaxes() {
		return ['css'];
	}

	public getBlocks(): IStyleBlock[] {
		return [
			{ syntax: 'css', content: '.text { content: "" }', range: null, error: null }
		];
	}
}

describe('Providers → Base', () => {
	const provider = new TestBaseProvider(null, null, 'css', { preset: 'csscomb' });

	it('should create instance', () => {
		assert.ok(provider instanceof BaseProvider);
	});

	it('should return true for supported syntax', () => {
		assert.ok(provider.isApplycable());
	});

	it('should return config from settings', async () => {
		const config = await provider.getConfig();

		assert.equal(config.from, 'predefined');
	});

	it('should return formated content', async () => {
		const expected: IStyleBlock[] = [{
			syntax: 'css',
			range: null,
			content: '.text\n{\n    content: \'\';\n}\n',
			error: null
		}];

		const actual = await provider.format();

		assert.deepEqual(actual, expected);
	});
});
