import { VueTypescriptInputPropsProvider } from "../vue-typescript-file-parsers/VueTypescriptInputPropsProvider";
import { VueTypescriptVariablesProvider } from "../vue-typescript-file-parsers/VueTypescriptVariablesProvider";
import { VueTypescriptFileParser } from "../vue-typescript-file-parsers/VueTypescriptFileParser";
import { VueHtmlParser } from "../vue-file-parsers/VueHtmlParser";
import * as vscode from 'vscode';
import { getWords, CodeWord } from "./CustomDefinitionProvider";
import { Factory } from "../vue-typescript-file-parsers/Factory";
import { TypescriptClass, CodeElement } from "../vue-typescript-file-parsers/Data";
import { getDependency } from "./CustomCompletionItemProvider";
import * as l from 'lodash';
import { matchAll } from "../vue-typescript-file-parsers/VueTypescriptMethodsProvider";
import { Localization } from "../localization-file-parsers/LocalizationFIleParser";

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
	}
}


export class VueLocalizationHoverProvider implements vscode.HoverProvider {
	provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Hover> {
		let vueFileContent = document.getText();
		let localizationFilePath = document.fileName.replace('.ts', '.localization').replace('.vue', '.localization');
		let localizationFileContent = Factory.fileManager.getFile(localizationFilePath);
		if (!localizationFileContent) {
			return;
		}

		let line = vueFileContent.split('\n')[position.line];
		let words = getWords(line, position.character);
		let lastWord = l(words).last() as CodeWord;
		let matches = matchAll(line, /\$t\ *\(('|")(\w+)('|")/gm)
			.filter(x => x.groups[2] == lastWord.name);
		if (matches.length == 0) {
			return;
		}

		let localizations = Factory.localizationFileParser.parse(localizationFileContent);
		let localization = l(localizations.filter(x => x.key == lastWord.name)).first() as Localization;
		if (!localization) {
			return;
		}

		return new Promise<vscode.Hover>(resolve => {
			resolve(new vscode.Hover(localization.translations.map(x => `${x.language} ${x.value}`), 
				new vscode.Range(position.line, lastWord.startIndex, position.line, lastWord.endIndex)));
		});
	}
}
