import { VueTypescriptDependenciesProvider, PathProvider, ConfigsFileProvider, PackageConfigManager, FileManager, TypescriptConfigManager } from "./VueTypescriptDependenciesProvider";
import { VueTypescriptMethodsProvider } from "./VueTypescriptMethodsProvider";
import { VueTypescriptInputPropsProvider } from "./VueTypescriptInputPropsProvider";
import { VueTypescriptPropertiesProvider } from "./VueTypescriptPropertiesProvider";
import { VueTypescriptVariablesProvider } from "./VueTypescriptVariablesProvider";
import { VueTypescriptMetaInformationProvider, VueTypescriptFileParser1 } from "./VueTypescriptFileParser";
import { LocalizationFileParser } from "../localization-file-parsers/LocalizationFIleParser";


export class Factory {
	public static pathProvider: PathProvider = new PathProvider();
	public static configsFileProvider: ConfigsFileProvider = new ConfigsFileProvider(Factory.pathProvider);
	public static packageConfigManager: PackageConfigManager = new PackageConfigManager(Factory.configsFileProvider);
	public static typescriptConfigManager: TypescriptConfigManager = new TypescriptConfigManager(Factory.configsFileProvider);
	public static fileManager: FileManager = new FileManager(Factory.typescriptConfigManager, Factory.pathProvider);
	public static localizationFileParser: LocalizationFileParser = new LocalizationFileParser();

	public static vueTypescriptDependenciesProvider: VueTypescriptDependenciesProvider = new VueTypescriptDependenciesProvider(Factory.packageConfigManager, Factory.fileManager);
	public static vueTypescriptMethodsProvider: VueTypescriptMethodsProvider = new VueTypescriptMethodsProvider();
	public static vueTypescriptInputPropsProvider: VueTypescriptInputPropsProvider = new VueTypescriptInputPropsProvider();
	public static vueTypescriptPropertiesProvider: VueTypescriptPropertiesProvider = new VueTypescriptPropertiesProvider();
	public static vueTypescriptVariablesProvider: VueTypescriptVariablesProvider = new VueTypescriptVariablesProvider();
	public static vueTypescriptMetaInformationProvider: VueTypescriptMetaInformationProvider = new VueTypescriptMetaInformationProvider();

	public static vueTypescriptParser: VueTypescriptFileParser1 = new VueTypescriptFileParser1(
		Factory.fileManager,
		Factory.vueTypescriptDependenciesProvider,
		Factory.vueTypescriptMethodsProvider,
		Factory.vueTypescriptInputPropsProvider,
		Factory.vueTypescriptPropertiesProvider,
		Factory.vueTypescriptVariablesProvider,
		Factory.vueTypescriptMetaInformationProvider
	);
}
