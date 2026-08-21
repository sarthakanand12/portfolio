/**
 * Theme → colour. Shared by the graph island and the homepage research map so
 * a concept is the same colour in both places. Lifted out of Graph.tsx.
 */
export const THEME_COLOR: Record<string, string> = {
  'RAG & Retrieval': '#4a5a68',
  'Dialogue Systems': '#7a5c8a',
  'Fine-tuning & Alignment': '#9c5b3f',
  'Inference Optimization': '#3f6b6b',
  'Agents & Orchestration': '#8a6d2f',
  Reasoning: '#5d7253',
  'Evaluation & Safety': '#a3623f',
  'Text2SQL & Tabular Data': '#556b8d',
  'NLP Applications': '#6b7a4a',
  'LLM Architecture & Internals': '#7d5470',
  'Representation Learning & Embeddings': '#487068',
  'Drift & Distribution Shift': '#8a6a55',
};

export const themeColor = (t: string | null | undefined): string =>
  (t && THEME_COLOR[t]) || '#6b6152';
