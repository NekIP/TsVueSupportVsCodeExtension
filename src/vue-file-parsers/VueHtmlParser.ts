import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class VueHtmlParser {
	text: string = '';
	path: string = '';
	public constructor(text: string, path: string) {
		this.text = text;
		this.path = path;
	}

	public getConnectedTypescriptFile(): string | undefined {
		let typescriptFilePath = this.getTypescriptFilePath();
		if (!typescriptFilePath) {
			return undefined;
		}
		if (fs.existsSync(typescriptFilePath)) {
			let file = fs.readFileSync(typescriptFilePath);
			let text = file.toString();
			return text;
		}
	}

	public getConnectedLocalizationFile(): string | undefined {
		let localizationFilePath = this.getLocalizationFilePath();
		if (!localizationFilePath) {
			return undefined;
		}
		if (fs.existsSync(localizationFilePath)) {
			let file = fs.readFileSync(localizationFilePath);
			let text = file.toString();
			return text;
		}
	}

	public getTypescriptFilePath(): string | undefined {
		const BeautifulDom = require('beautiful-dom');
		let parser = new BeautifulDom(this.text);
		let scriptElement = parser.getElementsByTagName('script');
		if (!scriptElement) {
			return undefined;
		}
		let typesriptPath = scriptElement[0].getAttribute('src') as string;
		if (!typesriptPath) {
			return undefined;
		}
		let directory = path.parse(this.path).dir;
		return path.resolve(directory, typesriptPath);
	}

	public getLocalizationFilePath(): string | undefined {
		const BeautifulDom = require('beautiful-dom');
		let parser = new BeautifulDom(this.text);
		let scriptElement = parser.getElementsByTagName('localization');
		if (!scriptElement) {
			return undefined;
		}
		let localizationPath = scriptElement[0].getAttribute('src') as string;
		if (!localizationPath) {
			return undefined;
		}
		let directory = path.parse(this.path).dir;
		return path.resolve(directory, localizationPath);
	}
}
