import { ExtractedShell } from "../../components/extracted-shell";
import { fetchAgents } from "../../lib/api";
import { AgentCard } from "../../components/agent-card";

type AgentsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AgentsPage({ searchParams }: AgentsPageProps) {
  const sp = await searchParams;
  const q = firstParam(sp.q);
  const area = firstParam(sp.area);
  const result = await fetchAgents({ q, area });

  return (
    <ExtractedShell>
      <main>
        <div className="agents-hero">
          <div className="container">
            <h1>Find Property Agents in Ghana</h1>
            <p>Connect with verified real estate professionals across Ghana</p>
            <form className="agents-search-bar" action="/agents" method="get">
              <input type="text" name="q" placeholder="Search by agent name or company..." defaultValue={q} />
              <input type="text" name="area" placeholder="Filter by area..." defaultValue={area} />
              <button className="btn btn-primary" type="submit">Search</button>
            </form>
          </div>
        </div>

        <div className="container">
          <div className="agents-grid">
            {result.items.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        </div>
      </main>
    </ExtractedShell>
  );
}
