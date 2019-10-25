export class LocalizationFileParser {
	public parse(fileContent: string): Localization[] {
		let result = [];
		let item = new Localization();
		let i = 0;
		fileContent.split('\n')
			.forEach(x => {
				i++;

				if (!x.trim()) {
					return;
				}

				if (x[0] == '\t') {
					let splited = x.replace(/\t{2,}/gm, '\t').split('\t').filter(y => !!y);
					if (splited.length == 2) {
						item.translations.push(new LocalizationTranslation(splited[0].trim(), splited[1].trim()));
					}
				}
				else {
					if (item.key) {
						result.push(item);
						item = new Localization();
					}

					item.key = x.trim();
					item.line = i - 1;
				}
			});

		result.push(item);

		return result;
	}
}

export class Localization {
	public key: string = '';
	public line: number = 0;
	public translations: LocalizationTranslation[] = [];
}

export class LocalizationTranslation {
	public constructor(
		public language: string = '',
		public value: string = '') { }
}