"""
graphify graph_query.py - BFS traversal for plan/implement skills.

Usage:
    py .claude/skills/graphify/graph_query.py "keyword1 keyword2 keyword3"

Outputs structured node+edge context to stdout. Paste the output verbatim
into the GRAPH CONTEXT block of subagent prompts.
"""
import json
import sys
from pathlib import Path

GRAPH_FILE = Path("graphify-out/graph.json")
GOD_THRESHOLD = 20
MAX_NODES = 40
MAX_EDGES = 80
BFS_DEPTH = 3

if not GRAPH_FILE.exists():
    print("No graph found at graphify-out/graph.json — skip graph context.")
    sys.exit(0)

try:
    import networkx as nx
    from networkx.readwrite import json_graph
except ImportError:
    print("networkx not installed — run: py -m pip install networkx")
    sys.exit(1)

query = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else ""
if not query.strip():
    print("Usage: py .claude/skills/graphify/graph_query.py \"keyword1 keyword2 keyword3\"")
    sys.exit(1)

terms = [t.lower() for t in query.split() if len(t) > 2]

data = json.loads(GRAPH_FILE.read_text(encoding="utf-8"))
G = json_graph.node_link_graph(data, edges="links")

def node_score(nid):
    label = G.nodes[nid].get("label", "").lower()
    src = G.nodes[nid].get("source_file", "").lower()
    return sum(1 for t in terms if t in label or t in src)

scored = sorted([(node_score(n), n) for n in G.nodes()], reverse=True)
start_nodes = [nid for score, nid in scored[:5] if score > 0]

if not start_nodes:
    print(f"No nodes matched terms: {terms}")
    print("Try broader keywords or run /graphify query manually.")
    sys.exit(0)

subgraph_nodes = set(start_nodes)
frontier = set(start_nodes)
for _ in range(BFS_DEPTH):
    next_frontier = set()
    for n in frontier:
        for neighbor in G.neighbors(n):
            if neighbor not in subgraph_nodes:
                next_frontier.add(neighbor)
    subgraph_nodes.update(next_frontier)
    frontier = next_frontier

god_hits = [
    (G.nodes[n].get("label", n), G.degree(n))
    for n in subgraph_nodes
    if G.degree(n) >= GOD_THRESHOLD
]

if god_hits:
    print("=== GOD NODE WARNING ===")
    for label, deg in sorted(god_hits, key=lambda x: -x[1]):
        print(f"  !! {label} — {deg} edges — changes here cascade widely")
    print()

ranked = sorted(subgraph_nodes, key=lambda n: -G.degree(n))

print(f"=== GRAPH CONTEXT ({len(subgraph_nodes)} nodes, BFS depth {BFS_DEPTH} from: {query!r}) ===")
print()
print("NODES (by connectivity — these files are covered by graph data):")
for nid in ranked[:MAX_NODES]:
    d = G.nodes[nid]
    label = d.get("label", nid)
    src = d.get("source_file", "")
    deg = G.degree(nid)
    print(f"  [{deg:>3} edges] {label}  |  {src}")

if len(subgraph_nodes) > MAX_NODES:
    print(f"  ... ({len(subgraph_nodes) - MAX_NODES} more nodes not shown)")

print()
print("EDGES (relationships within subgraph):")
edge_count = 0
for u, v in G.edges():
    if u in subgraph_nodes and v in subgraph_nodes and edge_count < MAX_EDGES:
        ed = G.edges[u, v]
        ul = G.nodes[u].get("label", u)
        vl = G.nodes[v].get("label", v)
        rel = ed.get("relation", "?")
        conf = ed.get("confidence", "?")
        print(f"  {ul} --{rel}[{conf}]--> {vl}")
        edge_count += 1

if edge_count == MAX_EDGES:
    print(f"  ... (truncated at {MAX_EDGES} edges)")

print()
print("FILE READ BUDGET: max 12 raw file reads per subagent.")
print("  Files in NODES above = use graph data, not file reads.")
print("  Only open a file for exact line numbers / method bodies not shown above.")
