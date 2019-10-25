import * as vscode from 'vscode';

export class CodeElement {
	public name: string = '';
	public accessModify?: AccessModify;
	public type?: string;
	public line: number = 0;
	public startPosition: number = 0;
	public endPosition: number = 0;

	public isSimpleType() {
		let type = (this.type || '' as string).toLowerCase();
		return /(Array *< *|)(number|string|datetime|date|any|boolean)( *>|( *\[ *\])*|)/gm.test(type);
	}

	public isArrayType() {
		let type = (this.type || '' as string).toLowerCase();
		return / *\[ *\] *$/gm.test(type);
	}
}

export class TypescriptDependency {
	public alias?: string;
	public importedObjects?: string[];
	public isLibrary: boolean = false;
	public line: string = '';
	public relativePath: string = '';
	public absolutePath: string = '';
	public from: string = '';
	public typescriptClass?: TypescriptClass;
}

export class TypescriptFile {
	public dependencies: TypescriptDependency[] = [];
	public classes: TypescriptClass[] = [];
	public path: string = '';
	public fileContent: string = '';
}

export class TypescriptClass {
	public variables: Variable[] = [];
	public inputProps: InputProp[] = [];
	public properties: Property[] = [];
	public methods: Method[] = [];
	public name: string = '';
	public path: string = '';
	public parent?: TypescriptClass;
	public dependencies: TypescriptDependency[] = [];
	public text: string = '';
}

export class Variable extends CodeElement { 
	public defaultValue?: string;
	public typeDependency?: TypescriptDependency;

	public toString(className: string): string {
		let accessModify = this.accessModify && (this.accessModify as string) !== '' ? this.accessModify + ' ' : '';
		let result = `(variable)\n${accessModify}${className}.${this.name}`;
		if (this.type) {
			result += `: ${this.type}`;
		}
		if (this.defaultValue) {
			result += ` = ${this.defaultValue}`;
		}
		return result;
	}

	public mapToCompletionItem(className: string): vscode.CompletionItem {
		let completionItem = new vscode.CompletionItem(this.name, vscode.CompletionItemKind.Variable);
		completionItem.detail = this.toString(className);
		return completionItem;
	}
}

export class Property extends CodeElement {
	public setSignature?: MethodParameter;

	public toString(className: string): string {
		let accessModify = this.accessModify && (this.accessModify as string) !== '' ? this.accessModify + ' ' : '';
		let result = `(property)\n${accessModify}${className}.${this.name}`;
		if (this.type) {
			result += `: ${this.type}`;
		}

		if (this.setSignature) {
			result += `\n\nset (property) ${accessModify}${className}.${this.name}(`;
			if (this.setSignature.name) {
				result += `${this.setSignature.name}`;
				if (this.setSignature.type) {
					result += `: ${this.setSignature.type}`;
				}
			}
			result += ')';
		}
		return result;
	}

	public mapToCompletionItem(className: string): vscode.CompletionItem {
		let completionItem = new vscode.CompletionItem(this.name, vscode.CompletionItemKind.Property);
		completionItem.detail = this.toString(className);
		return completionItem;
	}
}

export class InputProp extends CodeElement {
	public default?: string;
	public required?: boolean;

	public toString(className: string): string {
		let accessModify = this.accessModify && (this.accessModify as string) !== '' ? this.accessModify + ' ' : '';
		let result = `(input property)\n${accessModify}${className}.${this.name}`;
		if (this.type) {
			result += `: ${this.type}`;
		}
		if (this.default) {
			result += `\n\ndefault: ${this.default}`;
		}
		if (this.required) {
			result += `\n\nrequired`;
		}
		return result;
	}

	public mapToCompletionItem(className: string): vscode.CompletionItem {
		let completionItem = new vscode.CompletionItem(this.name, vscode.CompletionItemKind.Property);
		completionItem.detail = this.toString(className);
		return completionItem;
	}
}

export class Method extends CodeElement {
	public parameters: MethodParameter[] = [];
	public localVariableNames: string[] = [];

	public toString(className: string): string {
		let accessModify = this.accessModify && (this.accessModify as string) !== '' ? this.accessModify + ' ' : '';
		let result = `(method)\n${accessModify}${className}.${this.name}(`;

		result = `(method)\n${accessModify}${className}.${this.name}(`;

		if (this.parameters && this.parameters.length) {
			result += this.parameters.map(x => x.toString()).join(', ');
		}

		result += ')';

		if (this.type) {
			result += `: ${this.type}`;
		}

		return result;
	}

	public mapToCompletionItem(className: string): vscode.CompletionItem {
		let completionItem = new vscode.CompletionItem(this.name, vscode.CompletionItemKind.Method);
		completionItem.detail = this.toString(className);
		return completionItem;
	}
}

export class MethodSignature {
	public name: string = '';
	public methods: Method[] = [];
}

export class MethodParameter {
	public name: string = '';
	public type?: string;
	public defaultValue?: string;

	public toString(): string {
		let result = this.name;

		if (this.type) {
			result += `: ${this.type}`;
		}

		if (this.defaultValue) {
			result += ` = ${this.defaultValue}`;
		}

		return result;
	}
}

export type AccessModify = 'public' | 'protected' | 'private';