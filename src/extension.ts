// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as l from 'lodash';
import { VueTypescriptSignatureHelpProvider } from './providers/CustomSignatureHelpProvider';
import { CustomCompletionItemProvider, VueTypescriptCompletionItemProvider } from './providers/CustomCompletionItemProvider';
import { VueTypescriptHoverProvider } from './providers/CustomHoverProvider';
import { VueTypescriptDefinitionProviderProvider } from './providers/CustomDefinitionProviderProvider';

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('extension.tsVueSupport', () => {
		vscode.window.showInformationMessage('TS Vue Support is active');
	});

	context.subscriptions.push(disposable);

	let vueTypescriptCompletionItemProvider = vscode.languages.registerCompletionItemProvider({ scheme: 'file', language: 'vue' }, new VueTypescriptCompletionItemProvider());
	let vueTypescriptHoverProvider = vscode.languages.registerHoverProvider({ scheme: 'file', language: 'vue' }, new VueTypescriptHoverProvider());
	let vueTypescriptDefinitionProviderProvider = vscode.languages.registerDefinitionProvider({ scheme: 'file', language: 'vue' }, new VueTypescriptDefinitionProviderProvider());
	let d3 = vscode.languages.registerSignatureHelpProvider({ scheme: 'file', language: 'vue' }, new VueTypescriptSignatureHelpProvider(), '(', ',');

	context.subscriptions.push(vueTypescriptCompletionItemProvider);
	context.subscriptions.push(vueTypescriptCompletionItemProvider);
	context.subscriptions.push(vueTypescriptHoverProvider);
	context.subscriptions.push(vueTypescriptDefinitionProviderProvider);
}

export function deactivate() { }
