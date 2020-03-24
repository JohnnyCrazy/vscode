/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as path from 'path';
import { workspace, window, Uri } from 'vscode';

import { IIPCHandler, IIPCServer } from './ipc/ipcServer';
import { IDisposable } from './util';

export interface GitEditorEnvironment {
	GIT_EDITOR: string;
	ELECTRON_RUN_AS_NODE?: string;
	VSCODE_GIT_EDITOR_NODE?: string;
	VSCODE_GIT_EDITOR_MAIN?: string;
}

interface GitEditorRequest {
	commitMessagePath?: string;
}

export class GitEditor implements IIPCHandler {
	private disposable: IDisposable;

	static getDisabledEnv(): GitEditorEnvironment {
		return {
			GIT_EDITOR: path.join(__dirname, 'git-editor-empty.bat'),
		};
	}

	constructor(ipc: IIPCServer) {
		this.disposable = ipc.registerHandler('git-editor', this);
	}

	async handle({ commitMessagePath }: GitEditorRequest): Promise<any> {
		if (commitMessagePath) {
			const file = Uri.file(commitMessagePath);
			const doc = await workspace.openTextDocument(file);
			const editor = await window.showTextDocument(doc);
			return new Promise((c, e) => {
				const onDidChange = window.onDidChangeVisibleTextEditors((editors) => {
					if (editors.indexOf(editor) < 0) {
						onDidChange.dispose();
						return c('Hello World');
					}
				});
			});
		}
	}

	dispose(): void {
		this.disposable.dispose();
	}

	getEnv(): GitEditorEnvironment {
		return {
			GIT_EDITOR: `'${path.join(__dirname, 'git-editor.bat')}'`,
			ELECTRON_RUN_AS_NODE: '1',
			VSCODE_GIT_EDITOR_NODE: process.execPath,
			VSCODE_GIT_EDITOR_MAIN: path.join(__dirname, 'git-editor-main.js')
		};
	}
}
