import { VueTypescriptInputPropsProvider } from "../vue-typescript-file-parsers/VueTypescriptInputPropsProvider";
import { VueTypescriptVariablesProvider } from "../vue-typescript-file-parsers/VueTypescriptVariablesProvider";
import { VueTypescriptFileParser } from "../vue-typescript-file-parsers/VueTypescriptFileParser";
import { VueHtmlParser } from "../vue-file-parsers/VueHtmlParser";
import * as vscode from 'vscode';
import { getWords, CodeWord } from "./CustomDefinitionProviderProvider";
import { Factory } from "../vue-typescript-file-parsers/Factory";
import { TypescriptClass, CodeElement } from "../vue-typescript-file-parsers/Data";
import { getDependency } from "./CustomCompletionItemProvider";
import * as l from 'lodash';

export class VueTypescriptHoverProvider implements vscode.HoverProvider {
	provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Hover> {
		let vueFileContent = document.getText();
		let typescriptFileContent = new VueHtmlParser(vueFileContent, document.fileName).getConnectedTypescriptFile();
		let typescriptFilePath = new VueHtmlParser(vueFileContent, document.fileName).getTypescriptFilePath();
		if (!typescriptFileContent) {
			return;
		}

		let line = vueFileContent.split('\n')[position.line];
		let words = getWords(line, position.character);
		
		let typescriptFile = Factory.vueTypescriptParser.parse(typescriptFileContent, typescriptFilePath as string);
		let vueClass = l(typescriptFile.classes).first() as TypescriptClass;
		if (!vueClass) {
			return;
		}

		let word = l(words).last() as CodeWord;
		let dependencyTypescriptFile = getDependency(words, typescriptFile);

		let contents = '';
		let range: vscode.Range;

		dependencyTypescriptFile.classes.forEach(x => {
			let codeElement;
			if (!!(codeElement = l(x.variables).filter(y => y.name === word.name).first())
				|| !!(codeElement = l(x.methods).filter(y => y.name === word.name).first())
				|| !!(codeElement = l(x.properties).filter(y => y.name === word.name).first())
				|| !!(codeElement = l(x.inputProps).filter(y => y.name === word.name).first())) {
				contents = codeElement.toString(x.name);
				range = new vscode.Range(position.line, word.startIndex, position.line, word.endIndex);
			}
		});

		if (!contents) {
			return;
		}

		return new Promise<vscode.Hover>(resolve => {
			resolve(new vscode.Hover([contents], range));
		});

		/*let typescriptFileContent = new VueHtmlParser(document.getText(), document.fileName).getConnectedTypescriptFile();
		if (!typescriptFileContent) {
			return;
		}
		let filePath = new VueHtmlParser(document.getText(), document.fileName).getTypescriptFilePath();
		let text = document.getText();
		let line = text.split('\n')[position.line];
		let variableName = this.getWord(line, position.character);
		let variables = new VueTypescriptVariablesProvider().list(typescriptFileContent, typescriptFileContent);
		let variable = variables.filter(x => x.name == variableName.word)[0];
		let vueTypescriptFileParser = new VueTypescriptFileParser(typescriptFileContent, new VueTypescriptVariablesProvider(), new VueTypescriptInputPropsProvider());
		let className = vueTypescriptFileParser.getClassName();
		if (variable) {
			return new Promise<vscode.Hover>(resolve => {
				resolve({
					contents: [
						variable.toString(className)
					],
					range: new vscode.Range(position.line, variableName.startIndex, position.line, variableName.endIndex)
				} as vscode.Hover);
			});
		}*/
	}
	private getWord(line: string, cursorPosition: number): {
		word: string;
		startIndex: number;
		endIndex: number;
	} {
		let part1 = line.substring(0, cursorPosition);
		let part2 = line.substring(cursorPosition);
		let search1 = /\b(\w+)\b$/gm.exec(part1);
		let search2 = /^\b(\w+)\b/gm.exec(part2);
		part1 = (search1 || [''])[1];
		part2 = (search2 || [''])[1];
		return {
			word: part1 + part2,
			startIndex: cursorPosition - part1.length,
			endIndex: cursorPosition + part2.length
		};
	}
}
