import * as CSSComb from 'csscomb';

const DEFAULT_CONFIGS = {
	csscomb: CSSComb.getConfig('csscomb'),
	yandex: CSSComb.getConfig('yandex'),
	zen: CSSComb.getConfig('zen')
};

/**
 * Apply CSSComb to the given text with provided config.
 */
export function use(filename: string, text: string, syntax: string, config: object): Promise<string> {
	const csscomb = new CSSComb(config);

	return csscomb.processString(text, { syntax, filename });
}

export function getPredefinedConfigs(): object {
	return DEFAULT_CONFIGS;
}
