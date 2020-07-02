// @ts-ignore
import * as CSSComb from '../../csscomb.js/lib/csscomb.js';

interface IProcessOptions {
	filename?: string;
	context?: string;
	syntax: string;
}

declare class CSSCombConstructor {
	constructor(config: string | object);
	public static getConfig(name: string): object;
	public configure(config: object): void;
	public processString(text: string, options: IProcessOptions): Promise<string>;
}

type CSSComb = typeof CSSCombConstructor;

const DEFAULT_CONFIGS = {
	csscomb: (CSSComb as CSSComb).getConfig('csscomb'),
	yandex: (CSSComb as CSSComb).getConfig('yandex'),
	zen: (CSSComb as CSSComb).getConfig('zen')
};

/**
 * Apply CSSComb to the given text with provided config.
 */
export function use(filename: string, text: string, syntax: string, config: object): Promise<string> {
	const csscomb = new (CSSComb as CSSComb)(config);

	return csscomb.processString(text, { syntax, filename });
}

export function getPredefinedConfigs(): object {
	return DEFAULT_CONFIGS;
}
