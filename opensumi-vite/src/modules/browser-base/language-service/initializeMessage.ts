import { InitializeRequest } from 'vscode-languageserver-protocol'

export const initializeMessage = {
    ...InitializeRequest.type,
    numberOfParams: 1,
    jsonrpc: '2.0',
    params: {
        processId: null,
        clientInfo: {
            name: 'Monaco',
        },
        locale: 'zh-CN',
        // TODO 注意替换
        rootPath: '/home/webinfra/web-container-demo/',
        // TODO 注意替换
        rootUri: 'file:///home/webinfra/web-container-demo/',
        capabilities: {
            workspace: {
                applyEdit: true,
                workspaceEdit: {
                    documentChanges: true,
                    resourceOperations: ['create', 'rename', 'delete'],
                    failureHandling: 'textOnlyTransactional',
                    normalizesLineEndings: true,
                    changeAnnotationSupport: {
                        groupsOnLabel: true,
                    },
                },
                didChangeConfiguration: {
                    dynamicRegistration: true,
                },
                didChangeWatchedFiles: {
                    dynamicRegistration: true,
                },
                symbol: {
                    dynamicRegistration: true,
                    symbolKind: {
                        valueSet: [
                            1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
                            16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26,
                        ],
                    },
                    tagSupport: {
                        valueSet: [1],
                    },
                },
                codeLens: {
                    refreshSupport: true,
                },
                executeCommand: {
                    dynamicRegistration: true,
                },
                configuration: true,
                workspaceFolders: true,
                semanticTokens: {
                    refreshSupport: true,
                },
            },
            textDocument: {
                publishDiagnostics: {
                    relatedInformation: true,
                    versionSupport: false,
                    tagSupport: {
                        valueSet: [1, 2],
                    },
                    codeDescriptionSupport: true,
                    dataSupport: true,
                },
                synchronization: {
                    dynamicRegistration: true,
                    willSave: true,
                    willSaveWaitUntil: true,
                    didSave: true,
                },
                completion: {
                    dynamicRegistration: true,
                    contextSupport: true,
                    completionItem: {
                        snippetSupport: true,
                        commitCharactersSupport: true,
                        documentationFormat: ['markdown', 'plaintext'],
                        deprecatedSupport: true,
                        preselectSupport: true,
                        tagSupport: {
                            valueSet: [1],
                        },
                        insertReplaceSupport: true,
                        resolveSupport: {
                            properties: [
                                'documentation',
                                'detail',
                                'additionalTextEdits',
                            ],
                        },
                        insertTextModeSupport: {
                            valueSet: [1, 2],
                        },
                    },
                    completionItemKind: {
                        valueSet: [
                            1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
                            16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
                        ],
                    },
                },
                hover: {
                    dynamicRegistration: true,
                    contentFormat: ['markdown', 'plaintext'],
                },
                signatureHelp: {
                    dynamicRegistration: true,
                    signatureInformation: {
                        documentationFormat: ['markdown', 'plaintext'],
                        parameterInformation: {
                            labelOffsetSupport: true,
                        },
                        activeParameterSupport: true,
                    },
                    contextSupport: true,
                },
                definition: {
                    dynamicRegistration: true,
                    linkSupport: true,
                },
                references: {
                    dynamicRegistration: true,
                },
                documentHighlight: {
                    dynamicRegistration: true,
                },
                documentSymbol: {
                    dynamicRegistration: true,
                    symbolKind: {
                        valueSet: [
                            1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
                            16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26,
                        ],
                    },
                    hierarchicalDocumentSymbolSupport: true,
                    tagSupport: {
                        valueSet: [1],
                    },
                    labelSupport: true,
                },
                codeAction: {
                    dynamicRegistration: true,
                    isPreferredSupport: true,
                    disabledSupport: true,
                    dataSupport: true,
                    resolveSupport: {
                        properties: ['edit'],
                    },
                    codeActionLiteralSupport: {
                        codeActionKind: {
                            valueSet: [
                                '',
                                'quickfix',
                                'refactor',
                                'refactor.extract',
                                'refactor.inline',
                                'refactor.rewrite',
                                'source',
                                'source.organizeImports',
                            ],
                        },
                    },
                    honorsChangeAnnotations: false,
                },
                codeLens: {
                    dynamicRegistration: true,
                },
                formatting: {
                    dynamicRegistration: true,
                },
                rangeFormatting: {
                    dynamicRegistration: true,
                },
                onTypeFormatting: {
                    dynamicRegistration: true,
                },
                rename: {
                    dynamicRegistration: true,
                    prepareSupport: true,
                    prepareSupportDefaultBehavior: 1,
                    honorsChangeAnnotations: true,
                },
                documentLink: {
                    dynamicRegistration: true,
                    tooltipSupport: true,
                },
                typeDefinition: {
                    dynamicRegistration: true,
                    linkSupport: true,
                },
                implementation: {
                    dynamicRegistration: true,
                    linkSupport: true,
                },
                colorProvider: {
                    dynamicRegistration: true,
                },
                foldingRange: {
                    dynamicRegistration: true,
                    rangeLimit: 5000,
                    lineFoldingOnly: true,
                },
                declaration: {
                    dynamicRegistration: true,
                    linkSupport: true,
                },
                semanticTokens: {
                    dynamicRegistration: true,
                    tokenTypes: [
                        'namespace',
                        'type',
                        'class',
                        'enum',
                        'interface',
                        'struct',
                        'typeParameter',
                        'parameter',
                        'variable',
                        'property',
                        'enumMember',
                        'event',
                        'function',
                        'method',
                        'macro',
                        'keyword',
                        'modifier',
                        'comment',
                        'string',
                        'number',
                        'regexp',
                        'operator',
                    ],
                    tokenModifiers: [
                        'declaration',
                        'definition',
                        'readonly',
                        'static',
                        'deprecated',
                        'abstract',
                        'async',
                        'modification',
                        'documentation',
                        'defaultLibrary',
                    ],
                    formats: ['relative'],
                    requests: {
                        range: true,
                        full: {
                            delta: true,
                        },
                    },
                    multilineTokenSupport: false,
                    overlappingTokenSupport: false,
                },
                callHierarchy: {
                    dynamicRegistration: true,
                },
            },
            window: {
                showMessage: {
                    messageActionItem: {
                        additionalPropertiesSupport: true,
                    },
                },
                showDocument: {
                    support: true,
                },
                workDoneProgress: true,
            },
            general: {
                regularExpressions: {
                    engine: 'ECMAScript',
                    version: 'ES2020',
                },
                markdown: {
                    parser: 'marked',
                    version: '1.1.0',
                },
            },
        },
        initializationOptions: {
            npmLocation: '/usr/bin/npm',
            logVerbosity: 'verbose',
        },
        trace: 'off',
        workspaceFolders: null,
    },
}
