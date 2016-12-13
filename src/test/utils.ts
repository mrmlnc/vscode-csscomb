'use strict';

import * as fs from 'fs';

import { fileExist } from '../utils/fs';

export function timeOut() {
	return new Promise((resolve) => {
		setTimeout(resolve, 1000);
	});
}

export function removeFile(filepath: string) {
	return fileExist(filepath).then((exists) => {
		if (!exists) {
			return;
		}

		return new Promise((resolve, reject) => {
			fs.unlink(filepath, (err) => {
				if (err) {
					return reject(err);
				}

				resolve();
			});
		});
	});
}

export function writeFile(filepath: string, data: string) {
	return new Promise((resolve, reject) => {
		fs.writeFile(filepath, data, (err) => {
			if (err) {
				return reject(err);
			}

			resolve();
		});
	});
}
