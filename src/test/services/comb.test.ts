'use strict';

import * as assert from 'assert';
import * as path from 'path';

import * as vscode from 'vscode';

import { removeFile, writeFile, timeOut } from '../utils';
import { Config } from '../../services/config';
import { Comb } from '../../services/comb';

const config = new Config();
const fixtures = path.join(__dirname, '../../../fixtures');
const workspaceSettings = path.join(fixtures, '.vscode/settings.json');

suite('Services/Comb', () => {

	const comb = new Comb();

	test('Should work', () => {
		const settingsString = JSON.stringify({
			'csscomb.preset': {
				'color-case': 'upper'
			}
		});

		return removeFile(workspaceSettings)
			.then(() => writeFile(workspaceSettings, settingsString))
			.then(() => timeOut())
			.then(() => config.scan())
			.then((preset) => {
				return vscode.workspace.openTextDocument(path.join(fixtures, './css/test.css')).then((res) => {
					return comb.use(res, null, preset);
				});
			})
			.then((result) => {
				assert.ok(/#FFF/.test(result.css));
			});
	});

	test('Should work with HTML', () => {
		const settingsString = JSON.stringify({
			'csscomb.supportEmbeddedStyles': true,
			'csscomb.preset': {
				'color-case': 'upper'
			}
		});

		return removeFile(workspaceSettings)
			.then(() => writeFile(workspaceSettings, settingsString))
			.then(() => timeOut())
			.then(() => config.scan())
			.then((preset) => {
				return vscode.workspace.openTextDocument(path.join(fixtures, './html/test.html')).then((res) => {
					return comb.use(res, null, preset);
				});
			})
			.then((result) => {
				assert.ok(/#E5E5E5/.test(result.css));
			});
	});

});
