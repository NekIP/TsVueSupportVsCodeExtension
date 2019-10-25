import { InputProp, AccessModify } from './Data';
import { matchAll, AccessModifRegexpPattern, TypeRegexpPattern } from './VueTypescriptMethodsProvider';
import { getTypeOfCodeElement, getPosition } from './VueTypescriptVariablesProvider';

export class VueTypescriptInputPropsProvider {
	public constructor() { }
	
	public list(typescriptClassText: string, typescriptFileContent: string): InputProp[] {
		return matchAll(typescriptClassText, /@Prop\((\{ *((required|default): *(\w+) *) *(\,|)( *((required|default): *(\w+) *) *|)\}|)\)$(\r|)\n\t+(public|protected|private|) *(\w+)\?*: *((\w|\d|\[|\]|\{|\}|<|>|\.|\|| |,)+)/gm)
			.map(x => {
				let result = new InputProp();
				result.name = x.groups[12];
				result.accessModify = x.groups[11] as AccessModify;
				result.type = getTypeOfCodeElement(x.groups[13], x.match, typescriptClassText);
				[result.line, result.startPosition, result.endPosition] = getPosition(typescriptFileContent, x.match.split('\n')[1], result.name);
				let propOptions = this.getPropOptions(x.groups[3], x.groups[4], x.groups[8], x.groups[9]);
				result.default = propOptions.default;
				result.required = propOptions.required;
				return result;
			});
	}

	private getPropOptions(option1: string, option1Value: string, option2: string, option2Value: string): {
		default?: string;
		required?: boolean;
	} {
		let result = { default: undefined as string | undefined, required: undefined as boolean | undefined };
		if (option1 === 'default') {
			result.default = option1Value;
		}
		if (option1 === 'required') {
			result.required = option1Value === 'true';
		}
		if (option2 === 'default') {
			result.default = option2Value;
		}
		if (option2 === 'required') {
			result.required = option2Value === 'true';
		}
		return result;
	}
}
