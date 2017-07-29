'use strict';

import * as assert from 'assert';
import * as os from 'os';
import * as path from 'path';

import { removeFile, writeFile, timeOut } from '../utils';
import { Config } from '../../services/config';

const config = new Config();
const fixtures = path.join(__dirname, '../../../fixtures');
const workspaceSettings = path.join(fixtures, '.vscode/settings.json');
const workspaceConfig = path.join(fixtures, '.csscomb.json');
const globalConfig = path.join(os.homedir(), 'csscomb.json');

function removeConfigs() {
	return Promise.all([
		removeFile(workspaceSettings),
		removeFile(workspaceConfig),
		removeFile(globalConfig)
	]);
}

suite('Services/Config', () => {

	test('Editor settings', () => {
		const settingsString = JSON.stringify({
			'csscomb.preset': {
				'color-case': 'lower'
			}
		});

		return removeConfigs()
			.then(() => writeFile(workspaceSettings, settingsString))
			.then(() => timeOut())
			.then(() => config.scan())
			.then((preset) => {
				assert.deepEqual(preset, {
					'color-case': 'lower'
				});
			});
	});

	test('Editor Settings with filepath', () => {
		const settingsString = JSON.stringify({
			'csscomb.preset': './test.json'
		});

		return removeConfigs()
			.then(() => writeFile(workspaceSettings, settingsString))
			.then(() => timeOut())
			.then(() => config.scan())
			.then((preset) => {
				assert.deepEqual(preset, {
					'color-case': 'upper',
					file: true
				});
			});
	});

	test('Workspace config', () => {
		const settingsString = JSON.stringify({
			'color-case': 'upper',
			workspace: true
		});

		return removeConfigs()
			.then(() => writeFile(workspaceConfig, settingsString))
			.then(() => timeOut())
			.then(() => config.scan())
			.then((preset) => {
				assert.deepEqual(preset, {
					'color-case': 'upper',
					workspace: true
				});
			});
	});

	test('Global config', () => {
		const settingsString = JSON.stringify({
			'color-case': 'upper',
			global: true
		});

		return removeConfigs()
			.then(() => writeFile(globalConfig, settingsString))
			.then(() => timeOut())
			.then(() => config.scan())
			.then((preset) => {
				assert.deepEqual(preset, {
					'color-case': 'upper',
					global: true
				});
			});
	});

	test('Null config', () => {
		return removeConfigs()
			.then(() => timeOut())
			.then(() => config.scan())
			.then((preset) => {
				assert.deepEqual(preset, {});
			});
	});

});
