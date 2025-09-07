import { AgentChat } from "@/components/ui/agent-chat";


export default function Home() {
  return (
    <main className="container mx-auto py-8">
      <h1 className="text-3xl font-bold text-center mb-8">EvoAI Commerce Agent</h1>
      <AgentChat />
    </main>
  );
}