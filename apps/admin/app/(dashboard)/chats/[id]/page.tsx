import { redirect } from "next/navigation";
import { fetchAdminConversation, fetchAdminConversationMessages } from "@/lib/api";
import { AdminChatViewer } from "./chat-viewer";

type ChatDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminChatDetailPage({ params }: ChatDetailPageProps) {
  const { id } = await params;

  const [convo, initialMessages] = await Promise.all([
    fetchAdminConversation(id),
    fetchAdminConversationMessages(id),
  ]);

  if (!convo) redirect("/chats");

  return (
    <AdminChatViewer
      conversation={convo}
      initialMessages={initialMessages?.messages ?? []}
      initialHasMore={initialMessages?.hasMore ?? false}
    />
  );
}
