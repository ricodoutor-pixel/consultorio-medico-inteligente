/**
 * Real-time Chat Service
 * Manages WebSocket connections for patient-specialist communication
 */

interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: "patient" | "specialist";
  content: string;
  timestamp: Date;
  read: boolean;
  attachments?: Array<{
    type: string;
    url: string;
    name: string;
  }>;
}

interface Conversation {
  id: string;
  patientId: string;
  specialistId: string;
  consultationId: string;
  startedAt: Date;
  endedAt?: Date;
  status: "active" | "ended" | "archived";
  messageCount: number;
  lastMessage?: ChatMessage;
}

class RealtimeChatService {
  private activeConnections = new Map<string, any>();
  private conversations = new Map<string, Conversation>();
  private messageHistory = new Map<string, ChatMessage[]>();

  /**
   * Create new conversation
   */
  async createConversation(
    patientId: string,
    specialistId: string,
    consultationId: string
  ): Promise<Conversation> {
    try {
      const conversationId = `CONV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const conversation: Conversation = {
        id: conversationId,
        patientId,
        specialistId,
        consultationId,
        startedAt: new Date(),
        status: "active",
        messageCount: 0,
      };

      this.conversations.set(conversationId, conversation);
      this.messageHistory.set(conversationId, []);

      console.log(`[CHAT] Conversation created: ${conversationId}`);

      return conversation;
    } catch (error) {
      console.error("Create conversation error:", error);
      throw error;
    }
  }

  /**
   * Send message in conversation
   */
  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    attachments?: Array<{ type: string; url: string; name: string }>
  ): Promise<ChatMessage> {
    try {
      const message: ChatMessage = {
        id: `MSG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        conversationId,
        senderId,
        senderType: "patient", // TODO: Determine from user role
        content,
        timestamp: new Date(),
        read: false,
        attachments,
      };

      const messages = this.messageHistory.get(conversationId) || [];
      messages.push(message);
      this.messageHistory.set(conversationId, messages);

      const conversation = this.conversations.get(conversationId);
      if (conversation) {
        conversation.messageCount++;
        conversation.lastMessage = message;
      }

      console.log(`[CHAT] Message sent: ${message.id}`);

      // Emit to WebSocket subscribers
      this.broadcastMessage(conversationId, message);

      return message;
    } catch (error) {
      console.error("Send message error:", error);
      throw error;
    }
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(
    conversationId: string,
    limit: number = 50
  ): Promise<ChatMessage[]> {
    try {
      const messages = this.messageHistory.get(conversationId) || [];
      return Array.from(messages).slice(-limit);
    } catch (error) {
      console.error("Get conversation history error:", error);
      throw error;
    }
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId: string): Promise<boolean> {
    try {
      const allMessages = Array.from(this.messageHistory.values());
      for (const messages of allMessages) {
        const message = messages.find((m: ChatMessage) => m.id === messageId);
        if (message) {
          message.read = true;
          console.log(`[CHAT] Message marked as read: ${messageId}`);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error("Mark as read error:", error);
      throw error;
    }
  }

  /**
   * End conversation
   */
  async endConversation(conversationId: string): Promise<boolean> {
    try {
      const conversation = this.conversations.get(conversationId);
      if (conversation) {
        conversation.status = "ended";
        conversation.endedAt = new Date();
        console.log(`[CHAT] Conversation ended: ${conversationId}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error("End conversation error:", error);
      throw error;
    }
  }

  /**
   * Get active conversations for user
   */
  async getActiveConversations(userId: string): Promise<Conversation[]> {
    try {
      const conversations: Conversation[] = [];
      const allConversations = this.getAllConversations();
      for (const conv of allConversations) {
        if (
          (conv.patientId === userId || conv.specialistId === userId) &&
          conv.status === "active"
        ) {
          conversations.push(conv);
        }
      }
      return conversations;
    } catch (error) {
      console.error("Get active conversations error:", error);
      throw error;
    }
  }

  /**
   * Broadcast message to WebSocket subscribers
   */
  private broadcastMessage(conversationId: string, message: ChatMessage): void {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return;

    const recipientId =
      message.senderId === conversation.patientId
        ? conversation.specialistId
        : conversation.patientId;

    const connection = this.activeConnections.get(recipientId);
    if (connection) {
      connection.emit("message", {
        conversationId,
        message,
      });
    }
  }

  /**
   * Get all conversations (internal use)
   */
  private getAllConversations(): Conversation[] {
    return Array.from(this.conversations.values());
  }

  /**
   * Register WebSocket connection
   */
  registerConnection(userId: string, connection: any): void {
    this.activeConnections.set(userId, connection);
    console.log(`[CHAT] WebSocket connection registered: ${userId}`);
  }

  /**
   * Unregister WebSocket connection
   */
  unregisterConnection(userId: string): void {
    this.activeConnections.delete(userId);
    console.log(`[CHAT] WebSocket connection unregistered: ${userId}`);
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId: string): boolean {
    return this.activeConnections.has(userId);
  }

  /**
   * Get typing indicator
   */
  async setTypingIndicator(conversationId: string, userId: string, isTyping: boolean): Promise<void> {
    try {
      const conversation = this.conversations.get(conversationId);
      if (!conversation) return;

      const recipientId =
        userId === conversation.patientId
          ? conversation.specialistId
          : conversation.patientId;

      const connection = this.activeConnections.get(recipientId);
      if (connection) {
        connection.emit("typing", {
          conversationId,
          userId,
          isTyping,
        });
      }
    } catch (error) {
      console.error("Set typing indicator error:", error);
      throw error;
    }
  }

  /**
   * Upload file to conversation
   */
  async uploadFile(
    conversationId: string,
    userId: string,
    file: {
      name: string;
      type: string;
      size: number;
      buffer: Buffer;
    }
  ): Promise<{ url: string; name: string }> {
    try {
      // TODO: Upload to S3
      // TODO: Generate URL

      const fileUrl = `https://cdn.plantaeraiz.com/files/${Date.now()}-${file.name}`;

      console.log(`[CHAT] File uploaded: ${fileUrl}`);

      return {
        url: fileUrl,
        name: file.name,
      };
    } catch (error) {
      console.error("Upload file error:", error);
      throw error;
    }
  }

  /**
   * Search messages
   */
  async searchMessages(conversationId: string, query: string): Promise<ChatMessage[]> {
    try {
      const messages = this.messageHistory.get(conversationId) || [];
      return messages.filter((m: ChatMessage) =>
        m.content.toLowerCase().includes(query.toLowerCase())
      );
    } catch (error) {
      console.error("Search messages error:", error);
      throw error;
    }
  }

  /**
   * Get conversation statistics
   */
  async getConversationStats(conversationId: string): Promise<{
    messageCount: number;
    duration: number;
    averageResponseTime: number;
    attachmentCount: number;
  }> {
    try {
      const conversation = this.conversations.get(conversationId);
      const messages = this.messageHistory.get(conversationId) || [];

      if (!conversation) {
        throw new Error("Conversation not found");
      }

      const duration = conversation.endedAt
        ? conversation.endedAt.getTime() - conversation.startedAt.getTime()
        : Date.now() - conversation.startedAt.getTime();

      const attachmentCount = messages.reduce(
        (sum, m) => sum + (m.attachments?.length || 0),
        0
      );

      return {
        messageCount: messages.length,
        duration: Math.round(duration / 1000 / 60), // minutes
        averageResponseTime: 0, // TODO: Calculate
        attachmentCount,
      };
    } catch (error) {
      console.error("Get conversation stats error:", error);
      throw error;
    }
  }
}

export default new RealtimeChatService();
