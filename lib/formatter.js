'use strict';

var vscode = require('vscode');
var Comb = require('csscomb');

/**
 * Check file extension
 *
 * @param  {String} ext
 */
var _testExtension = function(ext) {
	return /(css|less|sass|scss)/.test(ext);
};

/**
 * Attempt to parse the JSON data
 *
 * @param  {String} fileData
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
 * @param  {Object} textEditor
 * @param  {Object} edit
 */
function Formatter(textEditor) {
	this.textEditor = textEditor;
}

/**
 * Run CSScomb
 *
 * @param  {Object} config
 */
Formatter.prototype._comb = function(config) {
	var document = this.textEditor.document;
	var targetText = document.getText();
	var lang = document._languageId;
	var comb = new Comb();
	comb.configure(config);

	if (_testExtension(lang)) {
		return comb.processString(targetText, { syntax: lang });
	}

	vscode.window.showWarningMessage('Cannot execute cssComb because there is not style files.');
	return false;
};

/**
 * Modification (saving) of data in the editor
 *
 * @param  {String} combedStyles
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
	var preset = vscode.workspace.getConfiguration('csscomb').preset || Comb.getConfig('csscomb');

	return vscode.workspace.findFiles('**/*csscomb.json', '{**/node_modules/**,**/bower_components/**}', 1)
		// Get array of files contain `csscomb.json` in name
		.then(function(arrayOfFiles) {
			if (arrayOfFiles.length) {
				return arrayOfFiles[0];
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
		});
};

exports.Engine = Formatter;
