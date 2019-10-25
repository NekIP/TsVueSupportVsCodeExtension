import { VueTypescriptInputPropsProvider } from "../vue-typescript-file-parsers/VueTypescriptInputPropsProvider";
import { VueTypescriptVariablesProvider } from "../vue-typescript-file-parsers/VueTypescriptVariablesProvider";
import { VueTypescriptFileParser } from "../vue-typescript-file-parsers/VueTypescriptFileParser";
import { VueHtmlParser } from "../vue-file-parsers/VueHtmlParser";
import * as vscode from 'vscode';
import { Factory } from "../vue-typescript-file-parsers/Factory";
import { getWords, CodeWord } from "./CustomDefinitionProviderProvider";
import * as l from 'lodash';
import { TypescriptClass, CodeElement, TypescriptDependency, TypescriptFile } from "../vue-typescript-file-parsers/Data";

export class CustomCompletionItemProvider implements vscode.CompletionItemProvider {
	provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList> {
		let file = new VueHtmlParser(document.getText(), document.fileName).getConnectedTypescriptFile();
		if (!file) {
			return;
		}
		let vueTypescriptFileParser = new VueTypescriptFileParser(file, new VueTypescriptVariablesProvider(), new VueTypescriptInputPropsProvider());
		let props = vueTypescriptFileParser.getProps();
		let variables = vueTypescriptFileParser.getVariables(props);
		let properties = vueTypescriptFileParser.getProperties();
		return new Promise<vscode.CompletionItem[]>(resolve => {
			resolve([...variables, ...props, ...properties]);
		});
	}
}

export class VueTypescriptCompletionItemProvider implements vscode.CompletionItemProvider {
	provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList> {
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


		let dependencyTypescriptFile = getDependency(words, typescriptFile);
		let completionItems: vscode.CompletionItem[] = [];
		completionItems = l(dependencyTypescriptFile.classes).map(x => [
			...x.methods.map(y => y.mapToCompletionItem(x.name)), 
			...x.variables.map(y => y.mapToCompletionItem(x.name)), 
			...x.properties.map(y => y.mapToCompletionItem(x.name)),
			...x.inputProps.map(y => y.mapToCompletionItem(x.name))
		]).flatten().value();

		return new Promise<vscode.CompletionItem[]>(resolve => {
			resolve(completionItems);
		});
	}
}

export function getDependency(words: CodeWord[], typescriptFile: TypescriptFile): TypescriptFile {
	if (words.length <= 1) {
		return typescriptFile;
	}

	let first = l(words).first() as CodeWord;
	let fields = l(typescriptFile.classes).map(x => [
		...x.variables, 
		...x.properties,
		...x.inputProps
	]).flatten().value();
	let field = l(fields.filter(x => x.name === first.name)).first() as CodeElement;
	if (field && !field.isSimpleType() && !field.isArrayType()) {
		let dependency = l(typescriptFile.dependencies).filter(x => x.alias === field.type || (x.importedObjects || []).includes(field.type || '')).first() as TypescriptDependency;
		if (dependency) {
			let dependencyFileContent = Factory.fileManager.getFile(dependency.absolutePath) as string;
			if (dependencyFileContent) {
				let dependencyTypescriptFile = Factory.vueTypescriptParser.parse(dependencyFileContent, dependency.absolutePath);
				return getDependency(words.slice(1), dependencyTypescriptFile);
			}
		}
	}

	return typescriptFile;
}