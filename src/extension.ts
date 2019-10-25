// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as l from 'lodash';
import { VueTypescriptSignatureHelpProvider } from './providers/CustomSignatureHelpProvider';
import { CustomCompletionItemProvider, VueTypescriptCompletionItemProvider, VueLocalizationCompletionItemProvider } from './providers/CustomCompletionItemProvider';
import { VueTypescriptHoverProvider, VueLocalizationHoverProvider } from './providers/CustomHoverProvider';
import { VueTypescriptDefinitionProvider, VueLocalizationDefinitionProvider } from './providers/CustomDefinitionProvider';

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('extension.tsVueSupport', () => {
		vscode.window.showInformationMessage('TS Vue Support is active');
	});

	context.subscriptions.push(disposable);

	let vueTypescriptCompletionItemProvider = vscode.languages.registerCompletionItemProvider({ scheme: 'file', language: 'vue' }, new VueTypescriptCompletionItemProvider());
	let vueTypescriptHoverProvider = vscode.languages.registerHoverProvider({ scheme: 'file', language: 'vue' }, new VueTypescriptHoverProvider());
	let vueTypescriptDefinitionProviderProvider = vscode.languages.registerDefinitionProvider({ scheme: 'file', language: 'vue' }, new VueTypescriptDefinitionProvider());
	let vueTypescriptSignatureHelpProvider = vscode.languages.registerSignatureHelpProvider({ scheme: 'file', language: 'vue' }, new VueTypescriptSignatureHelpProvider(), '(', ',');
	
	let vueLocalizationHoverProvider = vscode.languages.registerHoverProvider({ scheme: 'file', language: 'vue' }, new VueLocalizationHoverProvider());
	let vueLocalizationDefinitionProviderProvider = vscode.languages.registerDefinitionProvider({ scheme: 'file', language: 'vue' }, new VueLocalizationDefinitionProvider());
	let vueLocalizationCompletionItemProvider = vscode.languages.registerCompletionItemProvider({ scheme: 'file', language: 'vue' }, new VueLocalizationCompletionItemProvider());

	let vueLocalizationHoverProviderInTs = vscode.languages.registerHoverProvider('typescript', new VueLocalizationHoverProvider());
	let vueLocalizationDefinitionProviderProviderInTs = vscode.languages.registerDefinitionProvider('typescript', new VueLocalizationDefinitionProvider());
	let vueLocalizationCompletionItemProviderInTs = vscode.languages.registerCompletionItemProvider('typescript', new VueLocalizationCompletionItemProvider());


	context.subscriptions.push(vueTypescriptSignatureHelpProvider);
	context.subscriptions.push(vueTypescriptCompletionItemProvider);
	context.subscriptions.push(vueTypescriptHoverProvider);
	context.subscriptions.push(vueTypescriptDefinitionProviderProvider);

	context.subscriptions.push(vueLocalizationHoverProvider);
	context.subscriptions.push(vueLocalizationDefinitionProviderProvider);
	context.subscriptions.push(vueLocalizationCompletionItemProvider);

	context.subscriptions.push(vueLocalizationHoverProviderInTs);
	context.subscriptions.push(vueLocalizationDefinitionProviderProviderInTs);
	context.subscriptions.push(vueLocalizationCompletionItemProviderInTs);
}

export function deactivate() { }
