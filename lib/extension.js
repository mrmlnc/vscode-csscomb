'use strict';

var vscode = require('vscode');
var Formatter = require('./formatter');

function activate(context) {
	var processEditor = vscode.commands.registerTextEditorCommand('csscomb.processEditor', function(textEditor) {
		var formatter = new Formatter.Engine(textEditor);
		formatter.cssComb();
	});

	context.subscriptions.push(processEditor);
}

exports.activate = activate;
