import { VueTypescriptVariablesProvider } from "../vue-typescript-file-parsers/VueTypescriptVariablesProvider";
import { VueHtmlParser } from "../vue-file-parsers/VueHtmlParser";
import * as vscode from 'vscode';
import { VueTypescriptMethodsProvider, matchAll } from "../vue-typescript-file-parsers/VueTypescriptMethodsProvider";
import { VueTypescriptDependenciesProvider, PackageConfigManager, ConfigsFileProvider, PathProvider, FileManager, TypescriptConfigManager } from "../vue-typescript-file-parsers/VueTypescriptDependenciesProvider";
import { Factory } from "../vue-typescript-file-parsers/Factory";
import * as l from 'lodash';
import { TypescriptClass } from "../vue-typescript-file-parsers/Data";
import { getDependency } from "./CustomCompletionItemProvider";

export class VueTypescriptDefinitionProviderProvider implements vscode.DefinitionProvider {
	provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Location | vscode.Location[] | vscode.LocationLink[]> {
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

		let originRange: vscode.Range;
		let targetRange: vscode.Range;

		dependencyTypescriptFile.classes.forEach(x => {
			let codeElement;
			if (!!(codeElement = l(x.variables).filter(y => y.name === word.name).first())
				|| !!(codeElement = l(x.methods).filter(y => y.name === word.name).first())
				|| !!(codeElement = l(x.properties).filter(y => y.name === word.name).first())
				|| !!(codeElement = l(x.inputProps).filter(y => y.name === word.name).first())) {
				originRange = new vscode.Range(position.line, word.startIndex, position.line, word.endIndex);
				targetRange = new vscode.Range(codeElement.line, codeElement.startPosition, codeElement.line, codeElement.endPosition);
			}
		});

		return new Promise<vscode.LocationLink[]>(resolve => {
			resolve([{
				targetUri: vscode.Uri.file(dependencyTypescriptFile.path as string),
				originSelectionRange: originRange,
				targetRange: targetRange,
				targetSelectionRange: targetRange
			} as vscode.LocationLink]);
		});
		
		/*let typescriptFileContent = new VueHtmlParser(document.getText(), document.fileName).getConnectedTypescriptFile();
		let typescriptFilePath = new VueHtmlParser(document.getText(), document.fileName).getTypescriptFilePath();
		if (!typescriptFileContent) {
			return;
		}
		
		let class_ = Factory.vueTypescriptParser.parse(typescriptFileContent, typescriptFilePath || '');

		let filePath = new VueHtmlParser(document.getText(), document.fileName).getTypescriptFilePath();
		let text = document.getText();
		let line = text.split('\n')[position.line];
		let variableName = this.getWord(line, position.character);
		let variables = new VueTypescriptVariablesProvider().list(typescriptFileContent, typescriptFileContent);
		let variable = variables.filter(x => x.name == variableName.word)[0];
		if (variable) {
			if (variable.line >= 0 && variable.startPosition >= 0 && variable.endPosition >= 0) {
				return new Promise<vscode.LocationLink[]>(resolve => {
					resolve([{
						targetUri: vscode.Uri.file(filePath as string),
						originSelectionRange: new vscode.Range(position.line, variableName.startIndex, position.line, variableName.endIndex),
						targetRange: new vscode.Range(variable.line, variable.startPosition, variable.line, variable.endPosition),
						targetSelectionRange: new vscode.Range(variable.line, variable.startPosition, variable.line, variable.endPosition)
					} as vscode.LocationLink]);
				});
			}
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

export class CodeWord {
	public name: string = '';
	public startIndex: number = 0;
	public endIndex: number = 0;
}

export function getWords(line: string, cursorPosition: number): CodeWord[] {
	let part1 = line.substring(0, cursorPosition);
	let part2 = line.substring(cursorPosition);

	const extractWordUnderCursor = () => {
		let search1 = /\b(\w+)\b$/gm.exec(part1);
		let search2 = /^\b(\w+)\b/gm.exec(part2);
		let part1w = (search1 || ['', ''])[1];
		let part2w = (search2 || ['', ''])[1];
		let result = new CodeWord();
		result.name = part1w + part2w;
		result.startIndex = cursorPosition - part1w.length;
		result.endIndex = cursorPosition + part2w.length;
		return result;
	};

	let splitedPart1 = part1.split(/[^\w\.]/gm);
	let last = l(splitedPart1).last() as string;
	let words = matchAll(last, /\b(\w+)\b/gm);
	if (words.length === 1) {
		return [extractWordUnderCursor()];
	}
	else {
		const convertToCodeWords = () => {
			let matches = l(words).take(words.length - 1).value();
			let minIndex = line.indexOf(last);
			let i = 0;
			return matches.map(x => {
				i++;

				let result = new CodeWord();
				result.name = x.groups[1];
				result.startIndex = line.indexOf(result.name, minIndex);
				result.endIndex = result.startIndex + result.name.length;
				return result;
			});
		};

		return [...convertToCodeWords(), extractWordUnderCursor()];
	}
}
