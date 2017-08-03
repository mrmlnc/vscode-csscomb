import * as assert from 'assert';

import * as csscombService from './csscomb';

describe('Services → CSSComb', () => {
	const text = [
		'.text { content: "" }',
		'',
		''
	].join('\n');

	it('should work with custom config', async () => {
		const expected = [
			'.text { content: \'\'; }',
			''
		].join('\n');

		const actual = await csscombService.use('filename.css', text, 'css', {
			'strip-spaces': true,
			'always-semicolon': true,
			quotes: 'single'
		});

		assert.deepEqual(actual, expected);
	});

	it('should return built-in configs', () => {
		const expected = ['csscomb', 'yandex', 'zen'];

		const actual = csscombService.getPredefinedConfigs();

		assert.deepEqual(Object.keys(actual), expected);
	});
});
