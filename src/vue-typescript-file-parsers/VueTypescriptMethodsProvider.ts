import { Method, MethodParameter, AccessModify } from "./Data";
import { getPosition, getTypeOfCodeElement } from "./VueTypescriptVariablesProvider";

export class VueTypescriptMethodsProvider {
	public constructor() { }
	
	public list(typescriptClassString: string, typescriptFileContent: string): Method[] {
		return matchAll(typescriptClassString, /^(\t| {0,4})(public|protected|private|) {0,2}(\w+) {0,2}\(.*(\)|) {0,2}({|)/gm)
				.map(x => this.mapMethod(x, typescriptClassString, typescriptFileContent));
	}

	private mapMethod(x: { groups: string[], match: string }, typescriptClassString: string, typescriptFileContent: string) {
		let name = x.groups[3];
		let result = new Method();

		result.name = name;
		[result.line, result.startPosition, result.endPosition] = getPosition(typescriptFileContent, x.match, result.name);
		result.accessModify = x.groups[2] as AccessModify;

		let indexOf = typescriptClassString.indexOf(x.match);

		let parametersPart = extractBody(typescriptClassString, indexOf, '(', ')');
		let parametersPartSplited = parametersPart.split(',');

		if (parametersPartSplited.length > 1 || (/\b(\w+)\b/gi.exec(parametersPart) || [])[1] !== undefined) {
			result.parameters = parametersPartSplited.map(this.mapParameter);
		}

		result.type = ((/ *\?*: *((\w|\d|\[|\]|\{|\}|<|>|\.|\|| |,)+)/gm).exec(x.match.replace(parametersPart, '')) || [])[1];
		if (result.type) {
			result.type = result.type.trim();
			if (result.type[result.type.length - 1] === '{') {
				result.type = result.type.substr(0, result.type.length - 1).trim();
			}
		}

		return result;
	}

	private mapParameter(y: string) {
		let parameterName = undefined as string | undefined;
		let parameterType = undefined as string | undefined;
		let parameterDefaultValue = undefined as string | undefined;

		let splitedForType = y.split(':');

		parameterName = (/\b(\w+)\b/g.exec(splitedForType[0]) || [])[1];

		if (splitedForType.length > 1) {
			let typeOrDefaultValue = splitedForType[1].replace('(', '').replace(')', '').trim();
			let splitedForEquals = typeOrDefaultValue.split('=');
			if (splitedForEquals.length > 1) {
				parameterType = splitedForEquals[0].trim();
				parameterDefaultValue = splitedForEquals[1].trim();
			}
			else {
				parameterType = splitedForEquals[0].trim();
			}
		}
		else {
			let splitedForEquals = splitedForType[0].replace('(', '').replace(')', '').trim().split('=');
			if (splitedForEquals.length > 1) {
				parameterDefaultValue = splitedForEquals[1].trim();
			}
		}

		let result = new MethodParameter();

		result.defaultValue = parameterDefaultValue;
		result.type = parameterType;
		result.name = parameterName;

		return result;
	}
}

export const TypeRegexpPattern = '((\w|\d|\[|\]|\{|\}|<|>|\.|\|| |,)+)';
export const AccessModifRegexpPattern = '(public|protected|private|)';

export function matchAll(text: string, pattern: RegExp) {
	let result = [];
	let item;
	try {
		while ((item = pattern.exec(text)) !== null) {
			if (!item) {
				break;
			}

			result.push({ match: item[0], groups: [...item] });
		}
	}
	catch (e) {
		let ee = e;
	}

	return result;
}

export function extractBody(text: string, position: number, openSymbol: string, closeSymbol: string, includeTextBefore: boolean = false) {
	let isInString = false;
	let typeOfQuotes = '';
	let isInLineComment = false;
	let isInMultiLineComment = false;

	let countOfOpenSymbols = 0;
	let foundFirstOpenSymbol = false;

	let result = '';

	for (let i = position || 0; i < text.length; i++) {
		let c_c = text[i];
		let p_c = i > 0 ? text[i - 1] : '';

		if ((c_c === "'" || c_c === '"' || c_c === '`') && !(isInLineComment || isInMultiLineComment)) {
			if (!isInString) {
				isInString = true;
				typeOfQuotes = c_c;
			}
			else {
				if (p_c !== '\\' && typeOfQuotes == c_c) {
					isInString = false;
					typeOfQuotes = '';
				}
			}
		}

		if (c_c === "/" && p_c === '/' && !isInString) {
			isInLineComment = true;
		}

		if (c_c === "\n" && isInLineComment && !isInString) {
			isInLineComment = false;
		}

		if (c_c === "*" && p_c === '/' && !isInString) {
			isInMultiLineComment = true;
		}

		if (c_c === "/" && p_c === '*' && isInMultiLineComment && !isInString) {
			isInMultiLineComment = false;
		}

		if (c_c === openSymbol && !isInString && !isInLineComment && !isInMultiLineComment) {
			foundFirstOpenSymbol = true;
			countOfOpenSymbols++;
		}
		if (c_c === closeSymbol && !isInString && !isInLineComment && !isInMultiLineComment) {
			countOfOpenSymbols--;
		}

		if (foundFirstOpenSymbol || includeTextBefore) {
			result += c_c;
		}

		if (countOfOpenSymbols === 0 && foundFirstOpenSymbol) {
			return result;
		}
	}

	return result;
}