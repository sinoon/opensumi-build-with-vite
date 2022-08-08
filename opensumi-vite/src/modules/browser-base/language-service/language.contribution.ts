import { Autowired } from '@opensumi/di'
import {
    CancellationToken,
    Deferred,
    Domain,
    OnEvent,
    Uri,
    WithEventBus,
} from '@opensumi/ide-core-common'
import { ClientAppContribution, IClientApp } from '@opensumi/ide-core-browser'
import {
    Diagnostic,
    Location,
    Position,
    Range,
    Uri as URI,
} from '@opensumi/ide-extension/lib/common/vscode/ext-types'
import { DiagnosticCollection, TextDocument } from 'vscode'
import { IWorkspaceService } from '@opensumi/ide-workspace'
import { ILsifService } from './lsif-service/base'

import { TypeScriptLanguageService } from './typescript.service'
import { WebKernel } from '@byted-tbb/vm'
import {
    EditorDocumentModelContentChangedEvent,
    EditorDocumentModelCreationEvent,
    WorkbenchEditorService,
} from '@opensumi/ide-editor/lib/browser'
import { IDiskFileProvider } from '@opensumi/ide-file-service/lib/common'
import { CompletionContext } from '@opensumi/ide-extension/lib/common/vscode/model.api'
import { initializeMessage } from './initializeMessage'
import debug from 'debug'
import { BrowserVmContribution } from '../../browser-vm/browser-vm.contribution'
import { IWebKernel } from '../../browser-vm/constants'

const log = debug('devloop:language-service')
const diagnosticLog = debug('devloop:language-service:diagnostic')

const safeParse = (data: string) => {
    try {
        return JSON.parse(data)
    } catch (e) {
        return null
    }
}

export { LanguageServiceContribution }

@Domain(ClientAppContribution)
class LanguageServiceContribution
    extends WithEventBus
    implements ClientAppContribution
{
    @Autowired(TypeScriptLanguageService)
    private readonly simpleLanguageService: TypeScriptLanguageService

    @Autowired(IWorkspaceService)
    private readonly workspaceService: IWorkspaceService

    @Autowired(ILsifService)
    private readonly lsifService: ILsifService

    @Autowired(BrowserVmContribution)
    private readonly browserVmContribution: BrowserVmContribution

    @Autowired(IWebKernel)
    private readonly webKernel: WebKernel

    constructor() {
        super()
    }

    private process: ReturnType<WebKernel['spawn']>
    private processReady: Deferred<void> = new Deferred()

    private languageServerReady: Deferred<void> = new Deferred()
    /**
     * 启动 TypeScript Language Server
     * TODO 改为异步加载 ts server ，不然启动速度太长
     */
    async startTypeScriptLanguageServer() {
        log('start startTypeScriptLanguageServer')
        this.process = this.webKernel.spawn(
            '/app/cli.js',
            ['/app/cli.js', '--stdio', '--tsserver-path=/app/tsserver'],
            {
                pwd: '/home',
                stdio: [
                    { type: 'fd', fd: 0 },
                    { type: 'fd', fd: 1 },
                    { type: 'fd', fd: 2 },
                ],
            },
        )

        this.process.on('spawn', () => {
            log('spawn typescript language server')
            this.startListen()
            this.processReady.resolve()
        })
    }

    @Autowired(WorkbenchEditorService)
    private readonly workbenchEditorService: WorkbenchEditorService

    /**
     * 发送原始消息到 typescript language server's stdin
     * @param message
     * @param withoutWaiting
     */
    async sendMessage(
        message: Record<string, any>,
        withoutWaiting = false,
    ): Promise<void> {
        if (!withoutWaiting) {
            await this.processReady.promise
            await this.languageServerReady.promise
        }
        log('send message: %o', message)
        const messageString = JSON.stringify(message)
        const buffer = new TextEncoder().encode(messageString)
        const header = new TextEncoder()
            .encode(`Content-Length: ${buffer.length}\r
\r
`)

        return this.process.stdin.write(new Uint8Array([...header, ...buffer]))
    }

    startListen(): any {
        log('start listen')
        this.process.stdout.on('buffer', (buffer: Buffer) => {
            const string = new TextDecoder()
                .decode(buffer, { stream: true })
                .replace(/\r?\n/g, '\r\n')

            log('stdout: %s', string)

            this.handleRawMessage(string)
        })

        this.process.stderr.on('buffer', (buffer: Buffer) => {
            const string = new TextDecoder()
                .decode(buffer, { stream: true })
                .replace(/\r?\n/g, '\r\n')

            log('stderr: %s', string)

            this.handleRawMessage(string)
        })

        // TODO 暴露 spawn 出来，不然 TS 会提示这个类型无法被指明（named）
        return () => this.process.removeAllListeners('buffer')
    }

    /**
     * 对原始消息进行分割，再次分发消息
     * @param data
     */
    handleRawMessage(data: string) {
        data.split(/Content-Length: \d+/)
            .filter(Boolean)
            .map(item => item.replace('\r\n\r\n', ''))
            .map(data => this.handleMessage(data))
    }

    /**
     * 处理可被解析的消息内容
     * @param data
     */
    handleMessage(data: string) {
        log('handle message: %s', data)
        const message = safeParse(data)
        if (message == null) {
            log('message is not json')
            return
        }
        log('message: %o', message)
        // id
        if (message.id !== undefined) {
            // handle response
            // 去 callback map 里面去找 id 对应的 handler
            if (this.callbackMap.has(message.id)) {
                const handler = this.callbackMap.get(message.id)!
                this.callbackMap.delete(message.id)
                handler(message)
            }
        } else {
            if (message.method === 'textDocument/publishDiagnostics') {
                this.handleDiagnosticMessage(
                    message.params.uri,
                    message.params.diagnostics,
                )
            }
        }
    }

    private id = 0
    async sendAndWaitResponse(
        message: Record<string, any>,
        withoutWaiting = false,
    ): Promise<any> {
        let id
        if (
            message.method !== 'textDocument/didOpen' ||
            message.method !== 'textDocument/didChange'
        ) {
            id = this.id++
            message.id = id
        }
        if (id) {
            const p = new Promise(resolve =>
                this.callbackMap.set(id, data => {
                    resolve(data)
                }),
            )
            await this.sendMessage(message, withoutWaiting)
            return p
        } else {
            await this.sendMessage(message, withoutWaiting)
        }
    }

    callbackMap = new Map()

    async onDidStart(app: IClientApp): Promise<void> {
        await this.startTypeScriptLanguageServer()
        log('wait for start processReady')
        await this.processReady.promise
        log('process ready')
        // 初始化 ts server
        await this.sendAndWaitResponse(
            {
                ...initializeMessage,
                // 替换为真实项目
                rootPath: app.config.workspaceDir,
                rootUri: `file://${app.config.workspaceDir}`,
            },
            true,
        )
        this.languageServerReady.resolve()
    }

    onStart() {
        this.addDispose(
            this.simpleLanguageService.registerHoverProvider(
                { pattern: '**/*.{js,jsx,ts,tsx}' },
                {
                    provideHover: async (
                        document: TextDocument,
                        position: Position,
                    ) => {
                        const message = {
                            jsonrpc: '2.0',
                            method: 'textDocument/hover',
                            params: {
                                textDocument: {
                                    uri: document.uri.toString(),
                                },
                                position: position,
                            },
                        }

                        return this.sendAndWaitResponse(message).then(
                            (data: any) => data.result,
                        )
                    },
                },
            ),
        )

        this.addDispose(
            this.simpleLanguageService.registerDefinitionProvider(
                { pattern: '**/*.{js,jsx,ts,tsx}' },
                {
                    provideDefinition: async (
                        document: TextDocument,
                        position: Position,
                    ) => {
                        const message = {
                            method: 'textDocument/definition',
                            params: {
                                textDocument: {
                                    uri: document.uri.toString(),
                                },
                                position,
                            },
                        }

                        return this.sendAndWaitResponse(message).then(
                            (data: any) =>
                                data.result.map((item: any) => {
                                    return new Location(
                                        Uri.parse(item.uri),
                                        new Range(
                                            new Position(
                                                item.range.start.line,
                                                item.range.start.character,
                                            ),
                                            new Position(
                                                item.range.end.line,
                                                item.range.end.character,
                                            ),
                                        ),
                                    )
                                }),
                        )
                    },
                },
            ),
        )

        this.addDispose(
            this.simpleLanguageService.registerReferenceProvider(
                { pattern: '**/*.{js,jsx,ts,tsx}' },
                {
                    provideReferences: async (
                        document: TextDocument,
                        position: Position,
                    ) => {
                        const message = {
                            method: 'textDocument/references',
                            params: {
                                context: {
                                    includeDeclaration: true,
                                },
                                textDocument: {
                                    uri: document.uri.toString(),
                                },
                                position,
                            },
                        }

                        return this.sendAndWaitResponse(message).then(
                            (data: any) =>
                                data.result.map(
                                    r =>
                                        new Location(
                                            Uri.parse(r.uri),
                                            new Range(
                                                new Position(
                                                    r.range.start.line,
                                                    r.range.start.character,
                                                ),
                                                new Position(
                                                    r.range.end.line,
                                                    r.range.end.character,
                                                ),
                                            ),
                                        ),
                                ),
                        )
                    },
                },
            ),
        )

        this.addDispose(
            this.simpleLanguageService.registerCompletionItemProvider(
                { pattern: '**/*.{js,jsx,ts,tsx}' },
                {
                    provideCompletionItems: (
                        document: TextDocument,
                        position: Position,
                        token: CancellationToken,
                        context: CompletionContext,
                    ) => {
                        const message = {
                            method: 'textDocument/completion',
                            params: {
                                textDocument: {
                                    uri: document.uri.toString(),
                                },
                                context,
                                position,
                                token,
                            },
                        }
                        return this.sendAndWaitResponse(message).then(
                            (data: any) => data.result,
                        )
                    },
                },
                ['.'],
            ),
        )

        // 注册诊断集合
        this.diagnosticCollection =
            this.simpleLanguageService.createDiagnosticCollection('typescript')
    }

    handleDiagnosticMessage(uri: string, errors: Diagnostic[]) {
        log('handle diagnostics: \n%s\n%O', uri, errors)
        const fileUri = URI.parse(uri)
        this.diagnosticCollection.set(fileUri, errors)
    }

    private diagnosticCollection: DiagnosticCollection

    @Autowired(IDiskFileProvider)
    protected readonly diskFileProvider: IDiskFileProvider

    filterTargetLanguage(uri: string) {
        return /.(js|ts|tsx|jsx)$/gi.test(uri)
    }

    @OnEvent(EditorDocumentModelCreationEvent)
    onEditorDocumentModelContentCreationEvent(
        e: EditorDocumentModelCreationEvent,
    ) {
        const uri = e.payload.uri.toString()
        if (this.filterTargetLanguage(uri)) {
            this.sendMessage({
                jsonrpc: '2.0',
                method: 'textDocument/didOpen',
                params: {
                    textDocument: {
                        uri: e.payload.uri.toString(),
                        languageId: e.payload.languageId,
                        version: e.payload.versionId,
                        text: e.payload.content,
                    },
                    textDocumentSync: 2,
                },
            })
        }
    }

    @OnEvent(EditorDocumentModelContentChangedEvent)
    onEditorDocumentModelContentChangeEvent(
        e: EditorDocumentModelContentChangedEvent,
    ) {
        const uri = e.payload.uri.toString()
        if (this.filterTargetLanguage(uri)) {
            this.sendMessage({
                jsonrpc: '2.0',
                method: 'textDocument/didChange',
                params: {
                    textDocument: {
                        uri: e.payload.uri.toString(),
                        versionId: e.payload.versionId,
                    },
                    contentChanges: e.payload.changes.map(change => {
                        return {
                            range: reviveRange(
                                change.range.startLineNumber,
                                change.range.startColumn,
                                change.range.endLineNumber,
                                change.range.endColumn,
                            ),
                            text: change.text,
                        }
                    }),
                },
            })
        }
    }
}
function reviveRange(
    startLine: number,
    startColumn: number,
    endLine: number,
    endColumn: number,
): any {
    // note: language server range is 0-based, marker is 1-based, so need to deduct 1 here
    return {
        start: {
            line: startLine - 1,
            character: startColumn - 1,
        },
        end: {
            line: endLine - 1,
            character: endColumn - 1,
        },
    }
}
