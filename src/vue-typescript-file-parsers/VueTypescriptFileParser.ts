import { VueTypescriptInputPropsProvider } from "./VueTypescriptInputPropsProvider";
import { VueTypescriptVariablesProvider } from "./VueTypescriptVariablesProvider";
import * as vscode from 'vscode';
import { TypescriptClass, TypescriptFile } from "./Data";
import { VueTypescriptDependenciesProvider, FileManager } from "./VueTypescriptDependenciesProvider";
import { VueTypescriptMethodsProvider, matchAll, extractBody } from "./VueTypescriptMethodsProvider";
import { VueTypescriptPropertiesProvider } from "./VueTypescriptPropertiesProvider";

export class VueTypescriptFileParser1 {
	public constructor(
		private fileManager: FileManager,
		private dependenciesProvider: VueTypescriptDependenciesProvider,
		private methodsProvider: VueTypescriptMethodsProvider,
		private inputPropsProvider: VueTypescriptInputPropsProvider,
		private propertiesProvider: VueTypescriptPropertiesProvider,
		private variablesProvider: VueTypescriptVariablesProvider,
		private metaInformationProvider: VueTypescriptMetaInformationProvider) { }

	public parse(typescriptFileContent: string, typescriptFilePath: string): TypescriptFile {
		let result = new TypescriptFile();
		result.path = this.fileManager.resolvePath(typescriptFilePath);
		result.fileContent = typescriptFileContent;
		result.dependencies = this.dependenciesProvider.list(typescriptFileContent, typescriptFilePath);

		let classes = this.extractAllClasses(typescriptFileContent);
		result.classes = classes.map(x => {
			let tsClass = new TypescriptClass();

			tsClass.text = x;
			tsClass.name = this.metaInformationProvider.getClassName(x);
			tsClass.inputProps = this.inputPropsProvider.list(x, typescriptFileContent);
			tsClass.methods = this.methodsProvider.list(x, typescriptFileContent);
			tsClass.properties = this.propertiesProvider.list(x, typescriptFileContent);
			tsClass.variables = this.variablesProvider.list(x, typescriptFileContent).filter(y => tsClass.inputProps.filter(z => z.name === y.name).length == 0);

			return tsClass;
		});

		return result;

	}

	private extractAllClasses(typescriptString: string) {
		return matchAll(typescriptString, /export *(default|) +class +(\w+) *(implements|extends|) *((\w|\.)+|)/gm)
			.map(x => extractBody(typescriptString, typescriptString.indexOf(x.match), '{', '}', true));
	}
}


export class VueTypescriptMetaInformationProvider {
	public constructor() { }

	public getClassName(typescriptClassString: string): string {
		let reqexpPattern = /export *(default|) +(class|interface) +(\w+)( +extends +((\w|\.)+)|)/gm;
		let item = reqexpPattern.exec(typescriptClassString) as RegExpExecArray;
		return item[3];
	}
}

export class VueTypescriptFileParser {
	public constructor(private text: string, private variablesProvider: VueTypescriptVariablesProvider, private inputPropsProvider: VueTypescriptInputPropsProvider) { }
	
	public getClassName() {
		let reqexpPattern = /export default class (\w+) extends Vue/;
		let item = reqexpPattern.exec(this.text) as RegExpExecArray;
		return item[1];
	}

	public getVariables(props: vscode.CompletionItem[]) {
		let className = this.getClassName();
		let variables = this.variablesProvider.list(this.text, this.text);
		// filter variables by inputProps
		return variables.map(x => {
			let completionItem = new vscode.CompletionItem(x.name, vscode.CompletionItemKind.Variable);
			completionItem.detail = x.toString(className);
			return completionItem;
		});
	}

	public getProps() {
		let className = this.getClassName();
		let inputProps = this.inputPropsProvider.list(this.text, this.text);
		return inputProps.map(x => {
			let completionItem = new vscode.CompletionItem(x.name, vscode.CompletionItemKind.Property);
			let accessModify = x.accessModify && x.accessModify as string !== '' ? x.accessModify + ' ' : '';
			completionItem.detail = `(input property)\n${accessModify}${className}.${x.name}`;
			if (x.type) {
				completionItem.detail += `: ${x.type}`;
			}
			if (x.default) {
				completionItem.detail += `\n\ndefault: ${x.default}`;
			}
			if (x.required) {
				completionItem.detail += `\n\nrequired`;
			}
			return completionItem;
		});
	}
	public getProperties() {
		let reqexpPattern = /(public|private|protected|) *(get|set) +(\w+)\(((\w+)(: *((\w|\.|\[|\])+)|)|)\)(: *((\w|\.|\[|\])+)|)/gm;
		let result = [] as vscode.CompletionItem[];
		let item = {} as RegExpExecArray | null;
		let className = this.getClassName();
		let modifies = [];
		while ((item = reqexpPattern.exec(this.text)) !== null) {
			let propertyName = item[3];
			let accessModif = item[1];
			accessModif = accessModif && accessModif !== '' ? accessModif + ' ' : '';
			let modif = item[2];
			let parameterName = item[5];
			let parameterType = item[7];
			modif = modif;
			modifies.push({ propertyName, modif, parameterName, parameterType });
			let completionItem = new vscode.CompletionItem(propertyName, vscode.CompletionItemKind.Property);
			completionItem.detail = `(property)\n${accessModif}${className}.${propertyName}`;
			let type = item[10];
			if (type) {
				completionItem.detail += `: ${type}`;
			}
			if (modif == 'set') {
				completionItem.detail += `\nset ${accessModif}${className}.${propertyName}(`;
				if (parameterName && parameterType) {
					completionItem.detail += `${parameterName}: ${parameterType}`;
				}
				completionItem.detail += ')';
			}
			let completionItem2 = result.filter(x => x.label == completionItem.label)[0];
			if (!completionItem2) {
				result.push(completionItem);
			}
			else {
				if (modif == 'set') {
					completionItem2.detail = completionItem.detail;
				}
			}
		}
		return result;
	}
	public getMethods() {
		let reqexpPattern = /^\t(public|private|protected|) *(\w+)\(((\w|\.|\[|\]|=|\d| |:|,)+|)\)/gm;
		let result = [] as vscode.CompletionItem[];
		let item = {} as RegExpExecArray | null;
		let className = this.getClassName();
		let modifies = [];
		while ((item = reqexpPattern.exec(this.text)) !== null) {
			let propertyName = item[3];
			let accessModif = item[1];
			accessModif = accessModif && accessModif !== '' ? accessModif + ' ' : '';
			let modif = item[2];
			let parameterName = item[5];
			let parameterType = item[7];
			modif = modif;
			modifies.push({ propertyName, modif, parameterName, parameterType });
			let completionItem = new vscode.CompletionItem(propertyName, vscode.CompletionItemKind.Property);
			completionItem.detail = `(property)\n${accessModif}${className}.${propertyName}`;
			let type = item[10];
			if (type) {
				completionItem.detail += `: ${type}`;
			}
			if (modif == 'set') {
				completionItem.detail += `\nset ${accessModif}${className}.${propertyName}(`;
				if (parameterName && parameterType) {
					completionItem.detail += `${parameterName}: ${parameterType}`;
				}
				completionItem.detail += ')';
			}
			let completionItem2 = result.filter(x => x.label == completionItem.label)[0];
			if (!completionItem2) {
				result.push(completionItem);
			}
			else {
				if (modif == 'set') {
					completionItem2.detail = completionItem.detail;
				}
			}
		}
		return result;
	}
}


