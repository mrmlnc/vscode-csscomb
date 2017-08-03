import ConfigProfiler from 'config-profiler';

import * as csscomb from '../services/csscomb';

import { IPluginSettings, IFoundedConfig, IStyleBlock } from '../types';

const configProfiler = new ConfigProfiler(null, {
	allowHomeDirectory: true,
	predefinedConfigs: csscomb.getPredefinedConfigs(),
	configFiles: [
		'.csscomb.json',
		'csscomb.json',
		'.csscomb.js',
		'csscomb.js'
	],
	envVariableName: 'CSSCOMB_CONFIG',
	props: {
		package: 'csscombConfig'
	}
});

export default class BaseProvider {
	constructor(
		private workspace: string,
		private filepath: string,
		public syntax: string,
		private settings: IPluginSettings
	) { }

	public supportedSyntaxes(): string[] {
		return [];
	}

	public getBlocks(): IStyleBlock[] {
		return [];
	}

	public isApplycable(): boolean {
		return this.supportedSyntaxes().indexOf(this.syntax) !== -1;
	}

	public async format(): Promise<IStyleBlock[]> {
		const blocks = this.getBlocks();
		const foundedConfig = await this.getConfig();

		let config = {};
		if (foundedConfig) {
			config = foundedConfig.config;
		}

		for (let i = 0; i < blocks.length; i++) {
			const text = blocks[i].content;
			const syntax = blocks[i].syntax;

			try {
				blocks[i].content = await csscomb.use(this.filepath, text, syntax, config);
			} catch (err) {
				blocks[i].error = err;
			}
		}

		return blocks;
	}

	public getConfig(): Promise<IFoundedConfig> {
		configProfiler.setWorkspace(this.workspace);

		return configProfiler.getConfig(this.filepath, { settings: this.settings.preset });
	}
}
