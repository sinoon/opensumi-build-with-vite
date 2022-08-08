import * as monaco from '@opensumi/monaco-editor-core/esm/vs/editor/editor.api'
import { Autowired, ConstructorOf, Injectable } from '@opensumi/di'
import * as modes from '@opensumi/monaco-editor-core/esm/vs/editor/common/modes'
import * as vlp from 'vscode-languageserver-protocol'

import type * as vscode from 'vscode'
import {
    CancellationToken,
    CompletionItemProvider,
    DefinitionProvider,
    Diagnostic,
    DiagnosticCollection,
    DocumentSelector,
    HoverProvider,
    ReferenceProvider,
} from 'vscode'

import {
    ChainedCacheId,
    CompletionContext,
    Definition,
    DefinitionLink,
    Hover,
    ISerializedSignatureHelpProviderMetadata,
    Location,
    Position,
    ReferenceContext,
    SerializedDocumentFilter,
    SerializedLanguageConfiguration,
    VSCommand,
} from '@opensumi/ide-extension/lib/common/vscode/model.api'
import {
    ExtensionDocumentDataManager,
    ICodeActionProviderMetadataDto,
    IExtensionDescription,
    IExtHostLanguages,
    IMainThreadLanguages,
    ISuggestDataDto,
    ISuggestDataDtoField,
    ISuggestResultDtoField,
    MonacoModelIdentifier,
    RangeSuggestDataDto,
    testGlob,
} from '@opensumi/ide-extension/lib/common/vscode'
import {
    DisposableCollection,
    IMarkerData,
    IRange,
    IReporterService,
    LRUMap,
    MarkerManager,
    REPORT_NAME,
    Uri,
    URI,
} from '@opensumi/ide-core-common'
import {
    Disposable,
    SemanticTokensLegend,
    UriComponents,
} from '@opensumi/ide-extension/lib/common/vscode/ext-types'

import { DefinitionAdapter } from '@opensumi/ide-extension/lib/hosted/api/vscode/language/definition'
import { HoverAdapter } from '@opensumi/ide-extension/lib/hosted/api/vscode/language/hover'
import { ReferenceAdapter } from '@opensumi/ide-extension/lib/hosted/api/vscode/language/reference'
import { Adapter } from '@opensumi/ide-extension/lib/hosted/api/vscode/ext.host.language'

import { ExtHostDocumentData } from '@opensumi/ide-extension/lib/hosted/api/vscode/doc/ext-data.host'
import {
    IEditorDocumentModelService,
    ILanguageStatus,
    LanguageSelector,
} from '@opensumi/ide-editor/lib/browser'
import { fromLanguageSelector } from '@opensumi/ide-extension/lib/common/vscode/converter'
import { ITextModel } from '@opensumi/ide-monaco/lib/browser/monaco-api/types'
import { CompletionAdapter } from '@opensumi/ide-extension/lib/hosted/api/vscode/language/completion'
import { mixin } from '@opensumi/ide-extension/lib/common/vscode/utils'
import { Diagnostics } from '@opensumi/ide-extension/lib/hosted/api/vscode/language/diagnostics'
import { extname } from '@opensumi/monaco-editor-core/esm/vs/base/common/path'

@Injectable()
class LiteDocumentDataManager implements Partial<ExtensionDocumentDataManager> {
    @Autowired(IEditorDocumentModelService)
    private readonly docManager: IEditorDocumentModelService

    getDocumentData(path: Uri | string) {
        const uri = path.toString()
        const docRef = this.docManager.getModelReference(new URI(path))
        if (!docRef) {
            return undefined
        }

        const model = docRef.instance.getMonacoModel()

        const docModel = {
            lines: model.getLinesContent(),
            eol: docRef.instance.eol,
            languageId: docRef.instance.languageId,
            versionId: model.getVersionId(),
            dirty: docRef.instance.dirty,
        }

        return new ExtHostDocumentData(
            {
                $trySaveDocument() {
                    return docRef.instance.save()
                },
            } as any,
            Uri.parse(uri),
            docModel.lines,
            docModel.eol,
            docModel.languageId,
            docModel.versionId,
            docModel.dirty,
        )
    }
}

/**
 * IExtHostLanguages 的简单实现
 * 主要保留以下几个 API 供 lsif 服务使用
 *  * registerHoverProvider
 *  * registerDefinitionProvider
 *  * registerReferenceProvider
 */
@Injectable()
export class TypeScriptLanguageService
    implements Partial<IExtHostLanguages>, IMainThreadLanguages
{
    private callId = 0
    private adaptersMap = new Map<number, Adapter>()
    private readonly disposables = new Map<number, monaco.IDisposable>()

    private languageFeatureEnabled = new LRUMap<string, boolean>(200, 100)

    @Autowired(LiteDocumentDataManager)
    private readonly documents: ExtensionDocumentDataManager

    @Autowired(MarkerManager)
    readonly markerManager: MarkerManager

    private readonly diagnostics: Diagnostics

    async getLanguages(): Promise<string[]> {
        return this.$getLanguages()
    }

    constructor() {
        this.diagnostics = new Diagnostics(this)
    }

    // TODO just for fix type error
    $registerTypeHierarchyProvider(
        handle: number,
        selector: DocumentSelector,
    ): void {}

    registerCompletionItemProvider(
        selector: DocumentSelector,
        provider: CompletionItemProvider,
        triggerCharacters: string[],
    ): Disposable {
        const callId = this.addNewAdapter(
            new CompletionAdapter(
                provider,
                // @ts-ignore
                {
                    fromInternal(
                        command: VSCommand,
                    ): vscode.Command | undefined {
                        return undefined
                    },
                    toInternal: () => undefined,
                },
                this.documents,
            ),
        )
        this.$registerCompletionSupport(
            callId,
            this.transformDocumentSelector(selector),
            triggerCharacters,
            CompletionAdapter.hasResolveSupport(provider),
        )
        return this.createDisposable(callId)
    }

    // ### Hover begin
    registerHoverProvider(
        selector: DocumentSelector,
        provider: HoverProvider,
    ): Disposable {
        const callId = this.addNewAdapter(
            new HoverAdapter(provider, this.documents),
        )
        this.$registerHoverProvider(
            callId,
            this.transformDocumentSelector(selector),
        )
        return this.createDisposable(callId)
    }

    $provideHover(
        handle: number,
        resource: any,
        position: Position,
        token: CancellationToken,
    ): Promise<Hover | undefined> {
        return this.withAdapter(handle, HoverAdapter, adapter =>
            adapter.provideHover(resource, position, token),
        )
    }

    // TODO: I need this
    $registerHoverProvider(
        handle: number,
        selector: SerializedDocumentFilter[],
    ): void {
        const languageSelector = fromLanguageSelector(selector)
        const hoverProvider = this.createHoverProvider(handle, languageSelector)
        const disposable = new DisposableCollection()
        for (const language of this.getUniqueLanguages()) {
            if (this.matchLanguage(languageSelector, language)) {
                disposable.push(
                    monaco.languages.registerHoverProvider(
                        language,
                        hoverProvider,
                    ),
                )
            }
        }

        this.disposables.set(handle, disposable)
    }

    // ### Definition provider begin
    registerDefinitionProvider(
        selector: DocumentSelector,
        provider: DefinitionProvider,
    ): Disposable {
        const callId = this.addNewAdapter(
            new DefinitionAdapter(provider, this.documents),
        )
        this.$registerDefinitionProvider(
            callId,
            this.transformDocumentSelector(selector),
        )
        return this.createDisposable(callId)
    }

    $provideDefinition(
        handle: number,
        resource: Uri,
        position: Position,
        token: CancellationToken,
    ): Promise<Definition | DefinitionLink[] | undefined> {
        return this.withAdapter(handle, DefinitionAdapter, adapter =>
            adapter.provideDefinition(resource, position, token),
        )
    }

    $registerDefinitionProvider(
        handle: number,
        selector: SerializedDocumentFilter[],
    ): void {
        const languageSelector = fromLanguageSelector(selector)
        const definitionProvider = this.createDefinitionProvider(
            handle,
            languageSelector,
        )
        const disposable = new DisposableCollection()
        for (const language of this.getUniqueLanguages()) {
            if (this.matchLanguage(languageSelector, language)) {
                disposable.push(
                    monaco.languages.registerDefinitionProvider(
                        language,
                        definitionProvider,
                    ),
                )
            }
        }
        this.disposables.set(handle, disposable)
    }

    // TODO: I need this

    // ### Code Reference Provider begin
    registerReferenceProvider(
        selector: DocumentSelector,
        provider: ReferenceProvider,
    ): Disposable {
        const callId = this.addNewAdapter(
            new ReferenceAdapter(provider, this.documents),
        )
        this.$registerReferenceProvider(
            callId,
            this.transformDocumentSelector(selector),
        )
        return this.createDisposable(callId)
    }

    $provideReferences(
        handle: number,
        resource: Uri,
        position: Position,
        context: ReferenceContext,
        token: CancellationToken,
    ): Promise<Location[] | undefined> {
        return this.withAdapter(handle, ReferenceAdapter, adapter =>
            adapter.provideReferences(resource, position, context, token),
        )
    }

    private diagnosticCollection: DiagnosticCollection

    // ### Diagnostics begin
    get onDidChangeDiagnostics() {
        return this.diagnostics.onDidChangeDiagnostics
    }

    getDiagnostics(resource?: Uri): Diagnostic[] | [Uri, Diagnostic[]][] {
        return this.diagnostics.getDiagnostics(resource!)
    }

    createDiagnosticCollection(name?: string): DiagnosticCollection {
        return this.diagnostics.createDiagnosticCollection(name)
    }

    $clearDiagnostics(id: string): void {
        this.markerManager.clearMarkers(id)
    }

    $changeDiagnostics(id: string, delta: [string, IMarkerData[]][]): void {
        for (const [uriString, markers] of delta) {
            this.markerManager.updateMarkers(id, uriString, markers)
        }
    }

    // ### Diagnostics end

    @Autowired(IReporterService)
    reporter: IReporterService

    $provideCompletionItems(
        handle: number,
        resource: Uri,
        position: Position,
        context: CompletionContext,
        token: CancellationToken,
    ) {
        return this.withAdapter(handle, CompletionAdapter, adapter =>
            adapter.provideCompletionItems(resource, position, context, token),
        )
    }

    private isDeflatedSuggestDto(data: ISuggestDataDto | modes.CompletionItem) {
        return (
            data[ISuggestDataDtoField.label] ||
            data[ISuggestDataDtoField.kind] ||
            data[ISuggestDataDtoField.kindModifier] ||
            data[ISuggestDataDtoField.detail] ||
            data[ISuggestDataDtoField.documentation] ||
            data[ISuggestDataDtoField.sortText] ||
            data[ISuggestDataDtoField.filterText] ||
            data[ISuggestDataDtoField.preselect] ||
            data[ISuggestDataDtoField.range] ||
            data[ISuggestDataDtoField.insertTextRules] ||
            data[ISuggestDataDtoField.commitCharacters] ||
            data[ISuggestDataDtoField.insertText] ||
            data[ISuggestDataDtoField.command]
        )
    }

    private inflateLabel(
        label: string | modes.CompletionItemLabel,
    ): string | modes.CompletionItemLabel {
        if (typeof label === 'object') {
            return label
        }
        const splitted = label.split('~|')
        if (Array.isArray(splitted) && splitted.length > 1) {
            return {
                label: splitted[0],
                description: splitted[1],
                detail: splitted[2],
            }
        }
        return label
    }

    private inflateSuggestDto(
        defaultRange: IRange | { insert: IRange; replace: IRange },
        data: ISuggestDataDto,
    ): modes.CompletionItem {
        if (!this.isDeflatedSuggestDto(data)) {
            return data as unknown as modes.CompletionItem
        }
        const label = this.inflateLabel(
            data[ISuggestDataDtoField.label] as unknown as string,
        )

        return {
            label,
            kind:
                data[ISuggestDataDtoField.kind] ??
                modes.CompletionItemKind.Property,
            tags: data[ISuggestDataDtoField.kindModifier],
            detail: data[ISuggestDataDtoField.detail],
            documentation: data[ISuggestDataDtoField.documentation],
            sortText: data[ISuggestDataDtoField.sortText],
            filterText: data[ISuggestDataDtoField.filterText],
            preselect: data[ISuggestDataDtoField.preselect],
            insertText:
                data[ISuggestDataDtoField.insertText] ??
                (typeof label === 'string' ? label : label.label),
            // @ts-ignore
            range:
                // @ts-ignore
                RangeSuggestDataDto.from(data[ISuggestDataDtoField.range]) ??
                defaultRange,
            insertTextRules: data[ISuggestDataDtoField.insertTextRules],
            commitCharacters: data[ISuggestDataDtoField.commitCharacters],
            additionalTextEdits: data[ISuggestDataDtoField.additionalTextEdits],
            command: data[ISuggestDataDtoField.command],
            _id: data.x,
        }
    }

    $releaseCompletionItems(handle: number, id: number): void {
        this.withAdapter(handle, CompletionAdapter, adapter =>
            adapter.releaseCompletionItems(id),
        )
    }

    $resolveCompletionItem(
        handle: number,
        id: ChainedCacheId,
        token: CancellationToken,
    ): Promise<ISuggestDataDto | undefined> {
        return this.withAdapter(handle, CompletionAdapter, adapter =>
            adapter.resolveCompletionItem(id, token),
        )
    }

    $registerCompletionSupport(
        handle: number,
        selector: SerializedDocumentFilter[],
        triggerCharacters: string[],
        supportsResolveDetails: boolean,
    ): void {
        // NOTE monaco.languages.registerCompletionItemProvider api显示只能传string，实际内部实现支持DocumentSelector
        this.disposables.set(
            handle,
            monaco.languages.registerCompletionItemProvider(
                fromLanguageSelector(selector)! as any,
                {
                    triggerCharacters,
                    provideCompletionItems: async (
                        model: ITextModel,
                        position: monaco.Position,
                        context,
                        token: monaco.CancellationToken,
                    ) => {
                        if (!this.isLanguageFeatureEnabled(model)) {
                            return undefined
                        }
                        const timer = this.reporter.time(
                            REPORT_NAME.PROVIDE_COMPLETION_ITEMS,
                        )
                        const result = await this.$provideCompletionItems(
                            handle,
                            model.uri,
                            position,
                            context,
                            token,
                        )
                        if (!result) {
                            return undefined
                        }

                        if (result[ISuggestResultDtoField.completions].length) {
                            timer.timeEnd(extname(model.uri.fsPath), {
                                extDuration: result.d,
                            })
                        }
                        const suggestions = result[
                            ISuggestResultDtoField.completions
                        ].map(data =>
                            this.inflateSuggestDto(
                                result[ISuggestResultDtoField.defaultRanges],
                                data,
                            ),
                        ) as unknown as monaco.languages.CompletionItem[]
                        return {
                            suggestions,
                            duration: result[ISuggestResultDtoField.duration],
                            incomplete:
                                result[ISuggestResultDtoField.isIncomplete] ||
                                false,
                            dispose: () => {
                                if (result.x) {
                                    setTimeout(() => {
                                        this.$releaseCompletionItems(
                                            handle,
                                            result.x!,
                                        )
                                    }, 0)
                                }
                            },
                        }
                    },
                    resolveCompletionItem: supportsResolveDetails
                        ? async (suggestion, token) => {
                              this.reporter.point(
                                  REPORT_NAME.RESOLVE_COMPLETION_ITEM,
                              )
                              return this.$resolveCompletionItem(
                                  handle,
                                  suggestion._id!,
                                  token,
                              ).then(result => {
                                  if (!result) {
                                      return suggestion
                                  }
                                  const newSuggestion = this.inflateSuggestDto(
                                      suggestion.range,
                                      result,
                                  )
                                  return mixin(suggestion, newSuggestion, true)
                              })
                          }
                        : undefined,
                },
            ),
        )
    }

    // TODO: I need this
    $registerReferenceProvider(
        handle: number,
        selector: SerializedDocumentFilter[],
    ): void {
        const languageSelector = fromLanguageSelector(selector)
        const referenceProvider = this.createReferenceProvider(
            handle,
            languageSelector,
        )
        const disposable = new DisposableCollection()
        for (const language of this.getUniqueLanguages()) {
            if (this.matchLanguage(languageSelector, language)) {
                disposable.push(
                    monaco.languages.registerReferenceProvider(
                        language,
                        referenceProvider,
                    ),
                )
            }
        }
        this.disposables.set(handle, disposable)
    }

    isLanguageFeatureEnabled(model: ITextModel) {
        const uriString = model.uri.toString()
        if (!this.languageFeatureEnabled.has(uriString)) {
            this.languageFeatureEnabled.set(
                uriString,
                model.getValueLength() < 2 * 1024 * 1024,
            )
        }
        return this.languageFeatureEnabled.get(uriString)
    }

    // ### Hover end

    // TODO: I need this

    $getLanguages(): string[] {
        return monaco.languages.getLanguages().map(l => l.id)
    }

    protected createHoverProvider(
        handle: number,
        selector?: LanguageSelector,
    ): monaco.languages.HoverProvider {
        return {
            provideHover: (model, position, token) => {
                if (
                    !this.matchModel(
                        selector,
                        MonacoModelIdentifier.fromModel(model),
                    )
                ) {
                    return undefined!
                }
                if (!this.isLanguageFeatureEnabled(model)) {
                    return undefined!
                }
                return this.$provideHover(
                    handle,
                    model.uri,
                    position,
                    token,
                ).then(v => v!)
            },
        }
    }

    protected createDefinitionProvider(
        handle: number,
        selector: LanguageSelector | undefined,
    ): monaco.languages.DefinitionProvider {
        return {
            provideDefinition: async (model, position, token) => {
                if (
                    !this.matchModel(
                        selector,
                        MonacoModelIdentifier.fromModel(model),
                    )
                ) {
                    return undefined!
                }
                if (!this.isLanguageFeatureEnabled(model)) {
                    return undefined!
                }
                const result = await this.$provideDefinition(
                    handle,
                    model.uri,
                    position,
                    token,
                )
                if (!result) {
                    return undefined!
                }
                if (Array.isArray(result)) {
                    const definitionLinks: monaco.languages.LocationLink[] = []
                    for (const item of result) {
                        definitionLinks.push({
                            ...item,
                            uri: monaco.Uri.revive(item.uri),
                        })
                    }
                    return definitionLinks as monaco.languages.LocationLink[]
                } else {
                    // single Location
                    return {
                        uri: monaco.Uri.revive(result.uri),
                        range: result.range,
                    } as monaco.languages.Definition
                }
            },
        }
    }

    protected createReferenceProvider(
        handle: number,
        selector: LanguageSelector | undefined,
    ): monaco.languages.ReferenceProvider {
        return {
            provideReferences: (model, position, context, token) => {
                if (!this.isLanguageFeatureEnabled(model)) {
                    return undefined!
                }
                if (
                    !this.matchModel(
                        selector,
                        MonacoModelIdentifier.fromModel(model),
                    )
                ) {
                    return undefined!
                }
                return this.$provideReferences(
                    handle,
                    model.uri,
                    position,
                    context,
                    token,
                ).then(result => {
                    if (!result) {
                        return undefined!
                    }

                    if (Array.isArray(result)) {
                        const references: monaco.languages.Location[] = []
                        for (const item of result) {
                            references.push({
                                ...item,
                                uri: monaco.Uri.revive(item.uri),
                            })
                        }
                        return references
                    }

                    return undefined!
                })
            },
        }
    }

    // ### Definition provider end

    // TODO: I need this

    protected getUniqueLanguages(): string[] {
        const languages: string[] = []
        // 会有重复
        const allLanguages = monaco.languages.getLanguages().map(l => l.id)
        for (const language of allLanguages) {
            if (languages.indexOf(language) === -1) {
                languages.push(language)
            }
        }
        return languages
    }

    protected matchLanguage(
        selector: LanguageSelector | undefined,
        languageId: string,
    ): boolean {
        if (Array.isArray(selector)) {
            return selector.some(filter =>
                this.matchLanguage(filter, languageId),
            )
        }

        if (vlp.TextDocumentFilter.is(selector)) {
            return !selector.language || selector.language === languageId
        }

        return selector === languageId
    }

    protected matchModel(
        selector: LanguageSelector | undefined,
        model: MonacoModelIdentifier,
    ): boolean {
        if (Array.isArray(selector)) {
            return selector.some(filter => this.matchModel(filter, model))
        }
        if (vlp.TextDocumentFilter.is(selector)) {
            if (!!selector.language && selector.language !== model.languageId) {
                return false
            }
            if (!!selector.scheme && selector.scheme !== model.uri.scheme) {
                return false
            }
            if (
                !!selector.pattern &&
                !testGlob(selector.pattern, model.uri.path)
            ) {
                return false
            }
            return true
        }
        return selector === model.languageId
    }

    private nextCallId(): number {
        return this.callId++
    }

    // ### Code Reference Provider end

    private createDisposable(callId: number): Disposable {
        return new Disposable(() => {
            this.adaptersMap.delete(callId)
        })
    }

    private addNewAdapter(adapter: Adapter): number {
        const callId = this.nextCallId()
        this.adaptersMap.set(callId, adapter)
        return callId
    }

    // tslint:disable-next-line:no-any
    private withAdapter<A, R>(
        handle: number,
        constructor: ConstructorOf<A>,
        callback: (adapter: A) => Promise<R>,
    ): Promise<R> {
        const adapter = this.adaptersMap.get(handle)
        if (!(adapter instanceof constructor)) {
            return Promise.reject(new Error('no adapter found'))
        }
        return callback(adapter as A)
    }

    private transformDocumentSelector(
        selector: vscode.DocumentSelector,
    ): SerializedDocumentFilter[] {
        if (Array.isArray(selector)) {
            return selector.map(sel => this.doTransformDocumentSelector(sel)!)
        }

        // @ts-ignore
        return [this.doTransformDocumentSelector(selector)!]
    }

    private doTransformDocumentSelector(
        selector: string | vscode.DocumentFilter,
    ): SerializedDocumentFilter | undefined {
        if (typeof selector === 'string') {
            return {
                $serialized: true,
                language: selector,
            }
        }

        if (selector) {
            return {
                $serialized: true,
                language: selector.language,
                scheme: selector.scheme,
                pattern: selector.pattern,
            }
        }

        return undefined
    }

    $changeLanguage(
        resource: UriComponents,
        languageId: string,
    ): Promise<void> {
        return Promise.resolve(undefined)
    }

    $emitCodeLensEvent(eventHandle: number, event?: any): void {}

    $emitFoldingRangeEvent(eventHandle: number, event?: any): void {}

    $emitInlayHintsEvent(eventHandle: number, event?: any): void {}

    $emitInlineValuesEvent(eventHandle: number, event?: any): void {}

    $registerCallHierarchyProvider(
        handle: number,
        selector: SerializedDocumentFilter[],
    ): void {}

    $registerCodeLensSupport(
        handle: number,
        selector: SerializedDocumentFilter[],
        eventHandle?: number,
    ): void {}

    $registerDeclarationProvider(
        handle: number,
        selector: SerializedDocumentFilter[],
    ): void {}

    $registerDocumentColorProvider(
        handle: number,
        selector: SerializedDocumentFilter[],
    ): void {}

    $registerDocumentFormattingProvider(
        handle: number,
        extension: IExtensionDescription,
        selector: SerializedDocumentFilter[],
    ): void {}

    $registerDocumentHighlightProvider(
        handle: number,
        selector: SerializedDocumentFilter[],
    ): void {}

    $registerDocumentLinkProvider(
        handle: number,
        selector: SerializedDocumentFilter[],
        supportResolve: boolean,
    ): void {}

    $registerDocumentRangeSemanticTokensProvider(
        handle: number,
        selector: SerializedDocumentFilter[],
        legend: SemanticTokensLegend,
    ): void {}

    $registerDocumentSemanticTokensProvider(
        handle: number,
        selector: SerializedDocumentFilter[],
        legend: SemanticTokensLegend,
    ): void {}

    $registerEvaluatableExpressionProvider(
        handle: number,
        selector: SerializedDocumentFilter[],
    ): void {}

    $registerFoldingRangeProvider(
        handle: number,
        selector: SerializedDocumentFilter[],
        eventHandle: number | undefined,
    ): void {}

    $registerImplementationProvider(
        handle: number,
        selector: SerializedDocumentFilter[],
    ): void {}

    $registerInlayHintsProvider(
        handle: number,
        selector: SerializedDocumentFilter[],
        eventHandle: number | undefined,
    ): void {}

    $registerInlineValuesProvider(
        handle: number,
        selector: SerializedDocumentFilter[],
        eventHandle: number | undefined,
    ): void {}

    $registerLinkedEditingRangeProvider(
        handle: number,
        selector: SerializedDocumentFilter[],
    ): void {}

    $registerOnTypeFormattingProvider(
        handle: number,
        selector: SerializedDocumentFilter[],
        triggerCharacter: string[],
    ): void {}

    $registerOutlineSupport(
        handle: number,
        selector: SerializedDocumentFilter[],
    ): void {}

    $registerQuickFixProvider(
        handle: number,
        selector: SerializedDocumentFilter[],
        metadata: ICodeActionProviderMetadataDto,
        displayName: string,
        supportResolve: boolean,
    ): void {}

    $registerRangeFormattingProvider(
        handle: number,
        extension: IExtensionDescription,
        selector: SerializedDocumentFilter[],
    ): void {}

    $registerRenameProvider(
        handle: number,
        selector: SerializedDocumentFilter[],
        supportsResoveInitialValues: boolean,
    ): void {}

    $registerSelectionRangeProvider(
        handle: number,
        selector: SerializedDocumentFilter[],
    ): void {}

    $registerSignatureHelpProvider(
        handle: number,
        selector: SerializedDocumentFilter[],
        metadata: ISerializedSignatureHelpProviderMetadata,
    ): void {}

    $registerTypeDefinitionProvider(
        handle: number,
        selector: SerializedDocumentFilter[],
    ): void {}

    $registerWorkspaceSymbolProvider(handle: number): void {}

    $removeLanguageStatus(handle: number): void {}

    $setLanguageConfiguration(
        handle: number,
        languageId: string,
        configuration: SerializedLanguageConfiguration,
    ): void {}

    $setLanguageStatus(handle: number, status: ILanguageStatus): void {}

    $unregister(handle: number): void {}
}
