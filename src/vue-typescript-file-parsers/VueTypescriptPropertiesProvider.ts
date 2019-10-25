import { Property, AccessModify, MethodParameter } from "./Data";
import { matchAll, AccessModifRegexpPattern, TypeRegexpPattern } from "./VueTypescriptMethodsProvider";
import { getTypeOfCodeElement, getPosition } from "./VueTypescriptVariablesProvider";

export class VueTypescriptPropertiesProvider {
	public constructor() { }

	public list(typescriptClassString: string, typescriptFileContent: string): Property[] {
		let result: Property[] = [];
		matchAll(typescriptClassString, /^(\t| {0,4})(public|protected|private|) *(get|set) +(\w+) *\(((\w+)(\?*: *((\w|\d|\[|\]|\{|\}|<|>|\.|\|| |,)+)|)|)\)(\?*: *((\w|\d|\[|\]|\{|\}|<|>|\.|\|| |,)+)|)/gm)
			.map(x => {
				let modif = x.groups[3];
				let item = new Property();
				item.name = x.groups[4];
				item.accessModify = x.groups[2] as AccessModify;
				item.type = getTypeOfCodeElement(x.groups[11], x.match, typescriptClassString, false);

				if (item.type) {
					item.type = item.type.replace('{', '').replace('}', '').trim()
				}

				[item.line, item.startPosition, item.endPosition] = getPosition(typescriptFileContent, x.match, item.name);

				if (modif == 'set') {
					let parameterName = x.groups[6];
					let parameterType = x.groups[8];
					if (parameterName && parameterType) {
						item.setSignature = new MethodParameter();
						item.setSignature.name = parameterName;
						item.setSignature.type = parameterType;
					}
				}

				let item2 = result.filter(x => x.name == item.name)[0];
				if (!item2) {
					result.push(item);
				}
				else {
					if (modif == 'set') {
						item2.setSignature = item.setSignature;
					}
				}
			});
		return result;
	}
}
