/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * TEAMORA AI — Phases 81–106: RAG Studio & Autonomous Web Crawler
 * Interactive semantic vector search, chunk inspector, source citation traces,
 * SSRF-hardened web crawler, and automated knowledge base ingestion.
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import {
  Search,
  Globe,
  Database,
  Sparkles,
  ShieldCheck,
  ExternalLink,
  Layers,
  FileText,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Trash2,
  Cpu,
  BookOpen,
} from 'lucide-react';

interface Citation {
  docId: string;
  docTitle: string;
  chunkId: string;
  chunkIndex: number;
  snippet: string;
  score: number;
  sourceType: string;
  pageNumber?: number;
}

interface IngestedDoc {
  docId: string;
  title: string;
  sourceType: string;
  sourceUrl?: string;
  chunksCount: number;
  tags: string[];
  uploadedAt: string;
}

export const RagStudioView: React.FC = () => {
  const { currentOrg } = useApp();
  const [activeTab, setActiveTab] = useState<'query' | 'crawler' | 'documents'>('query');

  // Query State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [queryResults, setQueryResults] = useState<{
    citations: Citation[];
    synthesizedContext: string;
    confidenceScore: number;
    totalCandidates: number;
  } | null>(null);

  // Crawler State
  const [crawlUrl, setCrawlUrl] = useState('');
  const [isCrawling, setIsCrawling] = useState(false);
  const [crawlResult, setCrawlResult] = useState<any>(null);
  const [crawlError, setCrawlError] = useState<string | null>(null);

  // Ingested Docs State
  const [documents, setDocuments] = useState<IngestedDoc[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);

  // Manual Ingest State
  const [manualTitle, setManualTitle] = useState('');
  const [manualText, setManualText] = useState('');
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestSuccess, setIngestSuccess] = useState<string | null>(null);

  const fetchDocuments = async () => {
    setIsLoadingDocs(true);
    try {
      const res = await fetch(`/api/rag/documents?orgId=${currentOrg.id}`, {
        headers: { 'x-teamora-org': currentOrg.id },
      });
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (err) {
      console.warn('Failed to fetch documents:', err);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [currentOrg.id]);

  const handleSemanticSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch('/api/rag/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-teamora-org': currentOrg.id,
        },
        body: JSON.stringify({
          query: searchQuery,
          orgId: currentOrg.id,
          topK: 5,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setQueryResults({
          citations: data.citations || [],
          synthesizedContext: data.synthesizedContext || '',
          confidenceScore: data.confidenceScore || 0,
          totalCandidates: data.totalCandidates || 0,
        });
      }
    } catch (err) {
      console.error('RAG query error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleExecuteCrawl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!crawlUrl.trim()) return;

    setIsCrawling(true);
    setCrawlError(null);
    setCrawlResult(null);

    try {
      const res = await fetch('/api/crawler/crawl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-teamora-org': currentOrg.id,
        },
        body: JSON.stringify({
          url: crawlUrl,
          orgId: currentOrg.id,
          tags: ['automated-crawler', 'rag-studio'],
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCrawlResult(data);
        setCrawlUrl('');
        fetchDocuments();
      } else {
        setCrawlError(data.error || data.warnings?.[0] || 'Crawl failed due to security policy or network issue.');
      }
    } catch (err: any) {
      setCrawlError(err.message || 'Crawl network failure');
    } finally {
      setIsCrawling(false);
    }
  };

  const handleManualIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim() || !manualText.trim()) return;

    setIsIngesting(true);
    setIngestSuccess(null);
    try {
      const res = await fetch('/api/rag/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-teamora-org': currentOrg.id,
        },
        body: JSON.stringify({
          title: manualTitle,
          rawText: manualText,
          sourceType: 'manual',
          orgId: currentOrg.id,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setIngestSuccess(`Ingested "${manualTitle}" with ${data.chunksCount} semantic chunks.`);
        setManualTitle('');
        setManualText('');
        fetchDocuments();
      }
    } catch (err) {
      console.error('Ingest error:', err);
    } finally {
      setIsIngesting(false);
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    try {
      const res = await fetch(`/api/rag/document?docId=${docId}&orgId=${currentOrg.id}`, {
        method: 'DELETE',
        headers: { 'x-teamora-org': currentOrg.id },
      });
      if (res.ok) {
        fetchDocuments();
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-[#F5F1E9] dark:bg-[#181320] text-[#211B2C] dark:text-[#F5F1E9] transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase font-mono bg-[#8B5CF6]/15 text-[#8B5CF6] dark:text-[#A78BFA]">
            Phases 81–106
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            RAG Studio & Autonomous Crawler
          </h1>
          <p className="text-xs sm:text-sm text-[#77717D] dark:text-[#AFA8B8]">
            Enterprise Retrieval-Augmented Generation with hybrid vector search, SSRF-guarded web crawling, and verified source citations.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 p-1 bg-[#EBE5DB] dark:bg-[#2C2438] rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('query')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
              activeTab === 'query'
                ? 'bg-[#8B5CF6] text-white shadow-sm'
                : 'text-[#77717D] dark:text-[#AFA8B8] hover:text-[#211B2C]'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Semantic Search</span>
          </button>
          <button
            onClick={() => setActiveTab('crawler')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
              activeTab === 'crawler'
                ? 'bg-[#8B5CF6] text-white shadow-sm'
                : 'text-[#77717D] dark:text-[#AFA8B8] hover:text-[#211B2C]'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Web Crawler</span>
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
              activeTab === 'documents'
                ? 'bg-[#8B5CF6] text-white shadow-sm'
                : 'text-[#77717D] dark:text-[#AFA8B8] hover:text-[#211B2C]'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Vector Store ({documents.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: SEMANTIC VECTOR RETRIEVAL */}
      {activeTab === 'query' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] shadow-sm">
            <h2 className="text-base font-bold flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
              Hybrid Keyword & Vector Query
            </h2>
            <p className="text-xs text-[#77717D] dark:text-[#AFA8B8] mb-4">
              Queries the tenant's chunked vector embeddings with BM25 keyword boosting and cosine similarity reranking.
            </p>

            <form onSubmit={handleSemanticSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#77717D]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. What are our refund obligations under enterprise contracts?"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#F5F1E9] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] text-xs focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>
              <button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className="px-5 py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm transition-all"
              >
                {isSearching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span>Retrieve</span>
              </button>
            </form>
          </div>

          {queryResults && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-mono text-[#77717D] dark:text-[#AFA8B8]">
                <span>Retrieved {queryResults.citations.length} chunks from {queryResults.totalCandidates} total candidates</span>
                <span className="text-[#10B981] font-bold">Top Match Confidence: {Math.round(queryResults.confidenceScore * 100)}%</span>
              </div>

              {/* Citations Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {queryResults.citations.map((c, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] shadow-sm space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#8B5CF6] dark:text-[#A78BFA] flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" />
                        {c.docTitle}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#C7F36B]/25 text-[#162700] dark:bg-[#C7F36B]/20 dark:text-[#C7F36B]">
                        Score: {c.score}
                      </span>
                    </div>
                    <p className="text-xs text-[#211B2C] dark:text-[#F5F1E9] bg-[#F5F1E9] dark:bg-[#2C2438] p-2.5 rounded-lg border border-[#E2DBD0] dark:border-[#382F47]">
                      "{c.snippet}"
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-[#77717D] dark:text-[#AFA8B8] font-mono">
                      <span>Chunk #{c.chunkIndex + 1} • {c.sourceType.toUpperCase()}</span>
                      <span>Page {c.pageNumber || 1}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Synthesized Multi-Source Context */}
              <div className="p-4 rounded-xl bg-[#211B2C] text-[#F5F1E9] border border-[#382F47] space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#C7F36B]">
                  <Cpu className="w-4 h-4" />
                  Synthesized Grounding Context Ready for Agent Prompt Injection
                </div>
                <pre className="text-xs font-mono whitespace-pre-wrap text-[#AFA8B8] max-h-60 overflow-y-auto">
                  {queryResults.synthesizedContext}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: AUTONOMOUS WEB CRAWLER */}
      {activeTab === 'crawler' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#8B5CF6]" />
                SSRF-Hardened Autonomous Web Crawler
              </h2>
              <p className="text-xs text-[#77717D] dark:text-[#AFA8B8] mt-1">
                Crawls documentation or competitor sites, validates against RFC1918 private network rules, checks robots.txt, sanitizes HTML, and automatically ingests content into your RAG vault.
              </p>
            </div>

            <form onSubmit={handleExecuteCrawl} className="flex gap-2">
              <input
                type="url"
                value={crawlUrl}
                onChange={(e) => setCrawlUrl(e.target.value)}
                placeholder="https://example.com/docs/api-guide"
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#F5F1E9] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] text-xs focus:outline-none focus:border-[#8B5CF6]"
              />
              <button
                type="submit"
                disabled={isCrawling || !crawlUrl.trim()}
                className="px-5 py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm transition-all"
              >
                {isCrawling ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                <span>Crawl & Ingest</span>
              </button>
            </form>

            {crawlError && (
              <div className="p-3 rounded-xl bg-[#FF806E]/15 border border-[#FF806E]/40 text-[#FF806E] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{crawlError}</span>
              </div>
            )}

            {crawlResult && (
              <div className="p-4 rounded-xl bg-[#10B981]/15 border border-[#10B981]/40 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-[#10B981]">
                  <CheckCircle2 className="w-4 h-4" />
                  Successfully crawled and ingested into RAG store
                </div>
                <div className="text-xs space-y-1 text-[#211B2C] dark:text-[#F5F1E9]">
                  <p><strong>Title:</strong> {crawlResult.crawledPages?.[0]?.title}</p>
                  <p><strong>Words Extracted:</strong> {crawlResult.crawledPages?.[0]?.wordCount}</p>
                  <p><strong>Content Hash:</strong> <code className="font-mono text-[10px]">{crawlResult.crawledPages?.[0]?.contentHash}</code></p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: VECTOR STORE & MANUAL INGESTION */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          {/* Ingest Form */}
          <div className="p-5 rounded-2xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] shadow-sm space-y-3">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#8B5CF6]" />
              Ingest Document or Policy Text
            </h2>
            <form onSubmit={handleManualIngest} className="space-y-3">
              <input
                type="text"
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                placeholder="Document Title (e.g. Master Services Agreement 2026)"
                className="w-full px-3 py-2 rounded-xl bg-[#F5F1E9] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] text-xs focus:outline-none focus:border-[#8B5CF6]"
              />
              <textarea
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                rows={4}
                placeholder="Paste contract clauses, operational SOPs, or knowledge notes here..."
                className="w-full px-3 py-2 rounded-xl bg-[#F5F1E9] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] text-xs focus:outline-none focus:border-[#8B5CF6]"
              />
              <div className="flex items-center justify-between">
                {ingestSuccess && (
                  <span className="text-xs text-[#10B981] font-semibold">{ingestSuccess}</span>
                )}
                <button
                  type="submit"
                  disabled={isIngesting || !manualTitle.trim() || !manualText.trim()}
                  className="px-4 py-2 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 cursor-pointer transition-all ml-auto"
                >
                  {isIngesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
                  <span>Generate Chunks & Ingest</span>
                </button>
              </div>
            </form>
          </div>

          {/* Documents Table */}
          <div className="p-5 rounded-2xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold">Tenant Vector Catalog</h2>
              <button onClick={fetchDocuments} className="p-1 hover:text-[#8B5CF6] cursor-pointer">
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDocs ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {documents.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#77717D] dark:text-[#AFA8B8]">
                No documents currently ingested. Ingest manual text or crawl a URL above.
              </div>
            ) : (
              <div className="divide-y divide-[#E2DBD0] dark:divide-[#382F47]">
                {documents.map((doc) => (
                  <div key={doc.docId} className="py-3 flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-[#211B2C] dark:text-[#F5F1E9]">
                        {doc.title}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-[#77717D] dark:text-[#AFA8B8] font-mono">
                        <span className="uppercase">{doc.sourceType}</span>
                        <span>•</span>
                        <span>{doc.chunksCount} chunks</span>
                        <span>•</span>
                        <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteDoc(doc.docId)}
                      className="p-1.5 text-[#FF806E] hover:bg-[#FF806E]/10 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
