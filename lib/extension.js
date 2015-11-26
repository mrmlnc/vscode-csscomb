'use strict';

var vscode = require('vscode');
var Formatter = require('./formatter');

function activate(context) {
	var disposable = vscode.commands.registerTextEditorCommand('cssComb', function(textEditor) {
		var formatter = new Formatter.Engine(textEditor);
		formatter.cssComb();
	});

	context.subscriptions.push(disposable);
}

exports.activate = activate;
