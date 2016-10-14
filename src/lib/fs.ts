'use strict';

import * as fs from 'fs';

export function fileExist(filepath: string): Promise<boolean> {
	return new Promise((resolve) => {
		fs.access(filepath, (err) => {
			resolve(!err);
		});
	});
}

export function fileStat(filepath: string): Promise<fs.Stats> {
	return new Promise((resolve, reject) => {
		fs.stat(filepath, (err, stat) => {
			if (err) {
				return reject(err);
			}

			resolve(stat);
		});
	});
}

export function fileRead(filepath: string): Promise<string> {
	return new Promise((resolve, reject) => {
		fs.readFile(filepath, (err, file) => {
			if (err) {
				return reject(err);
			}

			resolve(file.toString());
		});
	});
}
