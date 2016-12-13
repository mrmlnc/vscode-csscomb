'use strict';

const testRunner = require('vscode/lib/testrunner');

testRunner.configure({
	ui: 'tdd',
	useColors: true,
	timeout: 10000
});

module.exports = testRunner;
