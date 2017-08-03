declare module "csscomb" {
	interface IProcessOptions {
		filename?: string;
		context?: string;
		syntax: string;
	}

	class CSSCombConstructor {
		constructor(config: string | object);
		static getConfig(name: string): object;
		configure(config: object): void;
		processString(text: string, options: IProcessOptions): Promise<string>;
	}

	namespace CSSCombConstructor {}

	export = CSSCombConstructor;
}
