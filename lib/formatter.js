'use strict';

var path = require('path');
var fs = require('fs');
var userHome = require('os').homedir();
var vscode = require('vscode');
var Comb = require('csscomb');

/**
 * Check the status of the global config file
 *
 * @return {Boolean}
 */
var _existsGlobalConfig = function() {
	return new Promise(function(resolve) {
		fs.stat(path.join(userHome, '.csscomb.json'), function(err) {
			if (err) {
				resolve(false);
			}

			resolve(true);
		});
	});
};

/**
 * Check file extension
 *
 * @param {String} ext
 */
var _testExtension = function(ext) {
	return /(css|less|sass|scss)/.test(ext);
};

/**
 * Attempt to parse the JSON data
 *
 * @param {String} fileData
 */
var _parseJsonFile = function(fileData) {
	try {
		return JSON.parse(fileData);
	} catch (err) {
		vscode.window.showErrorMessage('Provided JSON file contains syntax errors. Used standard configuration!');
	}
};

/**
 * Initialization();
 *
 * @param {Object} textEditor
 * @param {Object} edit
 */
function Formatter(textEditor) {
	this.textEditor = textEditor;
}

/**
 * Run CSScomb
 *
 * @param {Object} config
 */
Formatter.prototype._comb = function(config) {
	var document = this.textEditor.document;
	var targetText = document.getText();
	var lang = document.languageId || document._languageId;
	var comb = new Comb();
	comb.configure(config);

	if (_testExtension(lang)) {
		try {
			return comb.processString(targetText, { syntax: lang });
		} catch (err) {
			// For VS Code API: Sass === Scss
			if (err.syntax === 'sass') {
				return comb.processString(targetText, { syntax: 'scss' });
			}

			vscode.window.showErrorMessage(err);
		}
	}

	console.error('Cannot execute CSScomb because there is not style files.');
	return false;
};

/**
 * Modification (saving) of data in the editor
 *
 * @param {String} combedStyles
 */
Formatter.prototype._modifyEditorText = function(combedStyles) {
	var document = this.textEditor.document;
	var lastLine = document.lineAt(document.lineCount - 1);
	var selectAll = new vscode.Range(0, 0, lastLine.lineNumber, lastLine.range.end.character);
	this.textEditor.edit(function(editBuilder) {
		editBuilder.replace(selectAll, combedStyles);
	});
};

/**
 * Lifecycle extensions
 */
Formatter.prototype.cssComb = function() {
	var _that = this;
	var preset = vscode.workspace.getConfiguration('csscomb').preset || 'csscomb';
	if (typeof preset === 'string') {
		preset = Comb.getConfig(preset);
	}

	return Promise.all([
		vscode.workspace.findFiles('**/*csscomb.json', '{**/node_modules/**,**/bower_components/**}', 1),
		_existsGlobalConfig()
	])
		// Get array of files contain `csscomb.json` in name
		.then(function(arrayOfFiles) {
			if (arrayOfFiles[0][0]) {
				return arrayOfFiles[0][0];
			} else if (arrayOfFiles[1]) {
				return path.join(userHome, '.csscomb.json');
			}
		})
		// Read the configuration file
		.then(function(configPath) {
			if (configPath) {
				return vscode.workspace.openTextDocument(configPath);
			}
		})
		// Attempt to parse the JSON data
		.then(function(fileData) {
			if (fileData) {
				return _parseJsonFile(fileData.getText());
			}
		})
		// Run CSScomb
		.then(function(config) {
			var combedStyles = (config) ? _that._comb(config) : _that._comb(preset);
			if (combedStyles) {
				return _that._modifyEditorText(combedStyles);
			}
		})
		.catch(function(err) {
			console.error(err);
		});
};

exports.Engine = Formatter;
