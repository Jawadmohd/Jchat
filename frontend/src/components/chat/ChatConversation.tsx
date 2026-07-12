import { useState } from "react";
import toast from "react-hot-toast";
import {
  useDeleteMessageMutation,
  useGetMessagesQuery,
  useSendMessageMutation,
  useUpdateMessageMutation,
} from "../../features/chat/chatApi";
import { useChatRoom } from "../../hooks/useChatRoom";
import { getSocket } from "../../lib/socket";
import type { User } from "../../types/api";
import { getErrorMessage } from "../../utils/getErrorMessage";
import ChatHeader from "./ChatHeader";
import ChatInput from "./ChatInput";
import MessageList from "./MessageList";

interface ChatConversationProps {
  chatId: string;
  user: User;
  onBack: () => void;
}

export default function ChatConversation({ chatId, user, onBack }: ChatConversationProps) {
  const { data: messages = [], isLoading } = useGetMessagesQuery(chatId);
  const [sendMessageRest] = useSendMessageMutation();
  const [updateMessage] = useUpdateMessageMutation();
  const [deleteMessage] = useDeleteMessageMutation();
  const { typingUsername, sendMessage, emitTypingStart, emitTypingStop } =
    useChatRoom(chatId);
  const [isSending, setIsSending] = useState(false);

  const handleSend = async (content: string) => {
    setIsSending(true);

    try {
      if (getSocket().connected) {
        await sendMessage(content);
      } else {
        await sendMessageRest({ chatId, content }).unwrap();
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to send message"));
      throw error;
    } finally {
      setIsSending(false);
    }
  };

  const handleEditMessage = async (messageId: string, content: string) => {
    try {
      await updateMessage({ chatId, messageId, content }).unwrap();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to edit message"));
      throw error;
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteMessage({ chatId, messageId }).unwrap();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to delete message"));
      throw error;
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ChatHeader
        user={user}
        onBack={onBack}
        showBackButton
        typingUsername={typingUsername}
      />
      <div className="min-h-0 flex-1 overflow-hidden bg-primary">
        <MessageList
          messages={messages}
          isLoading={isLoading}
          onEditMessage={handleEditMessage}
          onDeleteMessage={handleDeleteMessage}
        />
      </div>
      <ChatInput
        onSend={handleSend}
        onTypingStart={emitTypingStart}
        onTypingStop={emitTypingStop}
        disabled={isSending}
      />
    </div>
  );
}
