"""Shared helpers for the build scripts. stdlib + PyYAML only."""
from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
PAPERS_INDEX = DATA / "papers_index.json"
CONCEPT_MAP = DATA / "concept_map.yaml"
GRAPH_JSON = DATA / "graph.json"
PAPERS_CONTENT = ROOT / "src" / "content" / "papers"

# Theme keys in papers_index.json.topics_by_theme are display names; the `path`
# field uses directory names. This maps directory -> display name so the two
# agree. Any directory not listed falls back to underscore-to-space title case.
THEME_DISPLAY = {
    "Agents_and_Orchestration": "Agents & Orchestration",
    "Dialogue_Systems": "Dialogue Systems",
    "Drift_and_Distribution_Shift": "Drift & Distribution Shift",
    "Evaluation_and_Safety": "Evaluation & Safety",
    "Finetuning_and_Alignment": "Fine-tuning & Alignment",
    "Inference_Optimization": "Inference Optimization",
    "LLM_Architecture": "LLM Architecture & Internals",
    "NLP_Applications": "NLP Applications",
    "RAG_and_Retrieval": "RAG & Retrieval",
    "Reasoning": "Reasoning",
    "Representation_Learning": "Representation Learning & Embeddings",
    "Text2SQL_and_Tabular": "Text2SQL & Tabular Data",
}

# Slugs are stable forever — project backlinks and external links depend on
# them. Never change this function's output for an existing title.
def slugify(text: str) -> str:
    text = unicodedata.normalize("NFKD", text)
    text = text.encode("ascii", "ignore").decode("ascii")
    text = text.lower()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")


def humanize_segment(seg: str) -> str:
    """Directory segment -> display label."""
    if seg in THEME_DISPLAY:
        return THEME_DISPLAY[seg]
    words = seg.replace("_", " ").split()
    small = {"and", "or", "for", "of", "the", "in", "to", "a", "an", "vs"}
    out = []
    for i, w in enumerate(words):
        if w.lower() == "and":
            out.append("&")
        elif w.lower() in small and i > 0:
            out.append(w.lower())
        elif w.isupper() or any(c.isdigit() for c in w):
            out.append(w)  # RAG, LLM, Text2SQL
        else:
            out.append(w[0].upper() + w[1:])
    return " ".join(out)


def parse_path(path: str) -> tuple[str, str | None]:
    """`Dialogue_Systems/Dialogue_Policy_Planning/x.pdf` -> theme, subtheme.

    Theme and subtheme come from the path; they are never duplicated into
    frontmatter (see CLAUDE.md).
    """
    parts = [p for p in path.split("/") if p]
    theme = humanize_segment(parts[0]) if parts else "Uncategorised"
    subtheme = humanize_segment(parts[1]) if len(parts) > 2 else None
    return theme, subtheme


def concept_label(cid: str) -> str:
    """`kv-cache-optimization` -> `KV Cache Optimization`."""
    acronyms = {
        "kv": "KV", "rag": "RAG", "llm": "LLM", "rl": "RL", "sql": "SQL",
        "peft": "PEFT", "lora": "LoRA", "ner": "NER", "cot": "CoT",
        "ia3": "(IA)^3",
    }
    # Hand-set labels where mechanical title-casing reads wrong.
    overrides = {
        "text-to-sql": "Text-to-SQL",
        "peft-lora": "PEFT / LoRA",
        "llm-as-judge": "LLM-as-Judge",
        "chain-of-thought": "Chain-of-Thought",
        "text-classification-ner": "Text Classification & NER",
        "structure-induction-clustering": "Structure Induction & Clustering",
        "kv-cache-optimization": "KV-Cache Optimization",
        "policy-gradient-rl": "Policy-Gradient RL",
        "rag-pipeline-design": "RAG Pipeline Design",
    }
    if cid in overrides:
        return overrides[cid]
    words = []
    for w in cid.split("-"):
        if w in acronyms:
            words.append(acronyms[w])
        elif w == "of":
            words.append("of")
        else:
            words.append(w[0].upper() + w[1:])
    return " ".join(words)


def load_papers() -> dict:
    with PAPERS_INDEX.open(encoding="utf-8") as fh:
        return json.load(fh)


def load_concept_map() -> dict:
    import yaml
    with CONCEPT_MAP.open(encoding="utf-8") as fh:
        return yaml.safe_load(fh)
