import { Variable, AccessModify } from './Data';
import { TypeRegexpPattern, AccessModifRegexpPattern, matchAll, extractBody } from './VueTypescriptMethodsProvider';

export class VueTypescriptVariablesProvider {
	public constructor() { }

	public list(typescriptClassString: string, typescriptFileContent: string): Variable[] {
		let reqexpPattern = /^(\t| {0,4})(public|protected|private|) {0,2}(\w+)( {0,2}\?*: {0,2}((\w|\d|\[|\]|\{|\}|<|>|\.|\|| |,)+)|( |)=( |)).*/gm;
		return matchAll(typescriptClassString, reqexpPattern)
			.map(x => {
				let result = new Variable();
				result.name = x.groups[3];
				result.accessModify = x.groups[2] as AccessModify;
				result.type = getTypeOfCodeElement(x.groups[5], x.match, typescriptClassString);
				result.defaultValue = getDefaultValue(x.match);
				[result.line, result.startPosition, result.endPosition] = getPosition(typescriptFileContent, x.match, result.name);
				return result;
			});
	}
}

function getVariables(text: string, excludePropNames: string[] = [], deepParsing: boolean = false) {
	let reqexpPattern = /^\t(public|protected|private|)(| )(\w+)(:( |)((\w|\.|\[|\])+)|( |)=( |)).*/gm;
	let result = [] as Variable[];
	let item = {} as RegExpExecArray | null;
	while ((item = reqexpPattern.exec(text)) !== null) {
		let variable = new Variable();
		variable.name = item[3];
		if (excludePropNames.filter(x => x == variable.name).length > 0) {
			continue;
		}
		variable.accessModify = item[1] as AccessModify;
		variable.type = item[6];
		variable.defaultValue = getDefaultValue(item[0]);
		[variable.line, variable.startPosition, variable.endPosition] = getPosition(text, item[0], variable.name);
		result.push(variable);
	}
	return result;
}

export function getTypeOfCodeElement(possiblyType: string, line: string, text: string, difficultTypeIsPossible: boolean = true): string {
	if (!possiblyType) {
		return possiblyType;
	}
	
	if (difficultTypeIsPossible && possiblyType.trim().endsWith('{')) {
		let ind1 = text.indexOf(line) + line.indexOf(possiblyType);
		return extractBody(text, ind1, '{', '}');
	}
	return (new RegExp(TypeRegexpPattern).exec(possiblyType.trim()) || [])[1];
}

export function getDefaultValue(line: string): string | undefined {
	let valueGroups = /( |)=( |)(.+)/gi.exec(line.trim().replace(/;$/gm, ''));
	if (valueGroups && valueGroups[3]) {
		return valueGroups[3];
	}
}

export function getPosition(text: string, line: string, word: string): [number, number, number] {
	let lines = text.split('\n');
	function getLineNumber() {
		let result = -1;
		for (let i in lines) {
			if (lines[i].startsWith(line)) {
				result = +i;
				break;
			}
		}

		return result;
	}

	let lineNumber = getLineNumber();
	let startPosition = -1;
	let endPosition = -1;
	if (lineNumber >= 0) {
		let ind = lines[lineNumber].indexOf(word);
		if (ind >= 0) {
			startPosition = ind;
			endPosition = ind + word.length;
		}
	}
	return [lineNumber, startPosition, endPosition];
}
