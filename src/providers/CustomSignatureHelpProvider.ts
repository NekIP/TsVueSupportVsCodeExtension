import * as vscode from 'vscode';
import { VueHtmlParser } from '../vue-file-parsers/VueHtmlParser';
import { getWords, CodeWord } from './CustomDefinitionProvider';
import { Factory } from '../vue-typescript-file-parsers/Factory';
import { TypescriptClass, Method } from '../vue-typescript-file-parsers/Data';
import { getDependency } from './CustomCompletionItemProvider';
import * as l from 'lodash';
import { matchAll } from '../vue-typescript-file-parsers/VueTypescriptMethodsProvider';

export class VueTypescriptSignatureHelpProvider implements vscode.SignatureHelpProvider {
	provideSignatureHelp(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.SignatureHelpContext): vscode.ProviderResult<vscode.SignatureHelp> {
		let vueFileContent = document.getText();
		let typescriptFileContent = new VueHtmlParser(vueFileContent, document.fileName).getConnectedTypescriptFile();
		let typescriptFilePath = new VueHtmlParser(vueFileContent, document.fileName).getTypescriptFilePath();
		if (!typescriptFileContent) {
			return;
		}

		let line = vueFileContent.split('\n')[position.line];
		let methodStart = l(matchAll(line, /\b(\w+)\(/gm)).last();
		if (!methodStart || !methodStart.match) {
			return;
		}

		let methodStartIndex = line.indexOf(methodStart.match);
		let methodPart = line.substr(methodStartIndex, position.character);
		let methodName = (l(methodPart.split('(')).first() as string).replace('(', '');
		let parameters = methodPart.replace(methodName + '(', '').split(',');
		let currentParameterPosition = parameters.length - 1;
		let words = getWords(line, methodStartIndex);
		
		let typescriptFile = Factory.vueTypescriptParser.parse(typescriptFileContent, typescriptFilePath as string);
		let vueClass = l(typescriptFile.classes).first() as TypescriptClass;
		if (!vueClass) {
			return;
		}

		let word = l(words).last() as CodeWord;
		let dependencyTypescriptFile = getDependency(words, typescriptFile);

		let result = new vscode.SignatureHelp();

		dependencyTypescriptFile.classes.forEach(x => {
			let codeElement: Method;
			if (!!(codeElement = l(x.methods).filter(y => y.name === word.name).first() as Method)) {
				result.activeParameter = currentParameterPosition;
				result.activeSignature = 0;
				result.signatures = [
					{
						label: codeElement.toString(x.name),
						parameters: codeElement.parameters.map(y => new vscode.ParameterInformation(y.toString()))
					} as vscode.SignatureInformation
				];
			}
		});

		return new Promise<vscode.SignatureHelp>(resolve => {
			resolve(result);
		});
	}
}
