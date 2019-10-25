import { TypescriptDependency } from "./Data";
import { matchAll } from "./VueTypescriptMethodsProvider";
import * as PathHelper from 'path';
import * as fs from 'fs';

export class VueTypescriptDependenciesProvider {
	public constructor(
		private packageConfigManager: PackageConfigManager,
		private fileManager: FileManager) { }

	public list(typescriptFileContent: string, typescriptFilePath: string): TypescriptDependency[] {
		return matchAll(typescriptFileContent, /import +(((\w+)|((\}|\{|\,| |\w)+)|\* *(as|) *(\w+)|('|")(\w+)('|")) *from *('|")(.+)('|") *|('|")(\w+)('|"))(;|)/gm)
			.map(x => {
				let result = new TypescriptDependency();

				result.alias = x.groups[3] || x.groups[7] || x.groups[15];
				result.line = x.match;
				result.from = x.groups[12] || x.groups[15];

				result.isLibrary = this.isLibrary(result.from, typescriptFilePath);

				if (!result.isLibrary) {
					result.relativePath = x.groups[12] || x.groups[15];
					result.absolutePath = this.fileManager.resolvePath(result.relativePath, PathHelper.dirname(typescriptFilePath));
				}

				let importedObjects = x.groups[4];
				if (importedObjects) {
					result.importedObjects = importedObjects.split(',').map(x => x.replace('{', '').replace('}', '').trim());
				}

				return result;
			});
	}

	private isLibrary(from: string, typescriptFilePath: string) {
		let libraries = this.packageConfigManager.getLibraryNames(typescriptFilePath);
		return libraries.includes(from);
	}
}

export class PathProvider {
	private rootPath: string = '';

	public constructor() { }
	
	public getRootPath(filePath: string) {
		if (!this.rootPath) {
			this.rootPath = this.findRootPath(filePath) as string;
		}

		return this.rootPath;
	}

	private findRootPath(path: string): string | undefined {
		let parent = PathHelper.parse(path).dir;
		if (parent && /(\w):\\(\w+)\\/gi.test(parent)) {
			let tsConfigFilePath = PathHelper.join(parent, 'tsconfig.json');
			let packageFilePath = PathHelper.join(parent, 'package.json');
			if (fs.existsSync(packageFilePath) || fs.existsSync(tsConfigFilePath)) {
				return parent;
			}
		}
		else {
			return undefined;
		}
	
		return this.findRootPath(parent);
	}
}

export class FileManager {
	public constructor(
		private typescriptConfigManager: TypescriptConfigManager,
		private pathProvider: PathProvider) { }

	public getFile(path: string, directory?: string) {
		path = this.resolvePath(path, directory);
		return this.tryOpenFileAndGetContent(path);
	}

	public resolvePath(path: string, directory?: string) {
		if (PathHelper.isAbsolute(path)) {
			return this.fixFileExtension(path);
		}

		if (path.startsWith('./') || path.startsWith('../')) {
			return this.makeAbsolutePath(path, directory);
		}

		let t1 = this.typescriptConfigManager.getPathAliases(path);
		let pathAliases = t1.map(x => [x[0].replace('*', ''), x[1].replace('*', '')]);
		pathAliases.forEach(x => {
			if (path.startsWith(x[0])) {
				path = path.replace(new RegExp(`^${x[0]}`), x[1]);
				return;
			}
		});

		return this.makeAbsolutePath(path);
	}

	private makeAbsolutePath(path: string, directory?: string) {
		if (directory) {
			path = PathHelper.join(directory, path);
		}
		else {
			path = PathHelper.join(this.pathProvider.getRootPath(path), path);
		}

		return this.fixFileExtension(path);
	}

	private fixFileExtension(path: string) {
		if (path && !path.endsWith('.ts') && !path.endsWith('.js') && !path.endsWith('.vue') && !path.endsWith('.localization')) {
			return path + '.ts';
		}

		return path;
	}

	private tryOpenFileAndGetContent(path: string) {
		if (fs.existsSync(path)) {
			return fs.readFileSync(path).toString();
		}

		return undefined;
	}
}

export class PackageConfigManager {
	public constructor(private configsFileProvider: ConfigsFileProvider) { } 

	public getLibraryNames(filePath: string): string[] {
		let config = this.configsFileProvider.getPackageConfig(filePath);
		if (config) {
			return [...Object.keys(config['dependencies']), ...Object.keys(config['devDependencies'])];
		}

		return [];
	}
}

export class TypescriptConfigManager {
	public constructor(private configsFileProvider: ConfigsFileProvider) { } 

	public getPathAliases(filePath: string): [string, string][] {
		let config = this.configsFileProvider.getTypescriptConfig(filePath);
		if (config) {
			return Object.keys(config['compilerOptions']['paths']).map(x => [x, config['compilerOptions']['paths'][x][0]]);
		}

		return [];
	}
}

export class ConfigsFileProvider {
	private typescriptConfig: any;
	private packageConfig: any;

	public constructor(private pathProvider: PathProvider) { }
	
	public getTypescriptConfig(filePath: string) {
		if (!this.typescriptConfig) {
			let rootPath = this.pathProvider.getRootPath(filePath);
			let configFilePath = PathHelper.join(rootPath, 'tsconfig.json');
			if (fs.existsSync(configFilePath)) {
				let fileContent = fs.readFileSync(configFilePath).toString().replace(/\/\*.+\*\//gm, '');
				this.typescriptConfig = JSON.parse(fileContent);
			}
		}

		return this.typescriptConfig;
	}

	public getPackageConfig(filePath: string) {
		if (!this.packageConfig) {
			let rootPath = this.pathProvider.getRootPath(filePath);
			let configFilePath = PathHelper.join(rootPath, 'package.json');
			if (fs.existsSync(configFilePath)) {
				let fileContent = fs.readFileSync(configFilePath).toString().replace(/\/\*.+\*\//gm, '');
				this.packageConfig = JSON.parse(fileContent);
			}
		}

		return this.packageConfig;
	}
}


