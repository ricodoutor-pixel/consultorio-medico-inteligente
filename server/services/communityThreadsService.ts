export interface Thread {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar: string;
    role: 'user' | 'doctor' | 'expert';
  };
  category: 'general' | 'medical' | 'technical' | 'marketplace' | 'testimonials';
  tags: string[];
  upvotes: number;
  downvotes: number;
  replies: Reply[];
  views: number;
  createdAt: Date;
  updatedAt: Date;
  pinned: boolean;
  solved: boolean;
  solvedBy?: string;
}

export interface Reply {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar: string;
    role: 'user' | 'doctor' | 'expert';
  };
  upvotes: number;
  downvotes: number;
  replies: Reply[]; // Nested replies
  createdAt: Date;
  updatedAt: Date;
  isAnswer: boolean;
}

export interface ThreadStats {
  totalThreads: number;
  totalReplies: number;
  activeUsers: number;
  topContributors: { userId: string; userName: string; contributions: number }[];
  mostViewedThreads: Thread[];
  trendingTopics: { tag: string; count: number }[];
}

export class CommunityThreadsService {
  /**
   * Cria nova thread
   */
  static createThread(threadData: Omit<Thread, 'id' | 'replies' | 'createdAt' | 'updatedAt'>): Thread {
    return {
      ...threadData,
      id: `thread_${Date.now()}`,
      replies: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Adiciona resposta à thread
   */
  static addReply(thread: Thread, reply: Omit<Reply, 'id' | 'createdAt' | 'updatedAt'>): Thread {
    const newReply: Reply = {
      ...reply,
      id: `reply_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return {
      ...thread,
      replies: [...thread.replies, newReply],
      updatedAt: new Date(),
    };
  }

  /**
   * Adiciona resposta aninhada
   */
  static addNestedReply(
    thread: Thread,
    parentReplyId: string,
    reply: Omit<Reply, 'id' | 'createdAt' | 'updatedAt'>
  ): Thread {
    const newReply: Reply = {
      ...reply,
      id: `reply_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updateReplies = (replies: Reply[]): Reply[] => {
      return replies.map((r) => {
        if (r.id === parentReplyId) {
          return {
            ...r,
            replies: [...r.replies, newReply],
            updatedAt: new Date(),
          };
        }
        return {
          ...r,
          replies: updateReplies(r.replies),
        };
      });
    };

    return {
      ...thread,
      replies: updateReplies(thread.replies),
      updatedAt: new Date(),
    };
  }

  /**
   * Marca resposta como solução
   */
  static markAsSolution(thread: Thread, replyId: string): Thread {
    const markReplyAsSolution = (replies: Reply[]): Reply[] => {
      return replies.map((r) => ({
        ...r,
        isAnswer: r.id === replyId,
        replies: markReplyAsSolution(r.replies),
      }));
    };

    return {
      ...thread,
      replies: markReplyAsSolution(thread.replies),
      solved: true,
      solvedBy: replyId,
      updatedAt: new Date(),
    };
  }

  /**
   * Upvota thread
   */
  static upvoteThread(thread: Thread, userId: string): Thread {
    return {
      ...thread,
      upvotes: thread.upvotes + 1,
      updatedAt: new Date(),
    };
  }

  /**
   * Downvota thread
   */
  static downvoteThread(thread: Thread, userId: string): Thread {
    return {
      ...thread,
      downvotes: thread.downvotes + 1,
      updatedAt: new Date(),
    };
  }

  /**
   * Upvota resposta
   */
  static upvoteReply(thread: Thread, replyId: string): Thread {
    const updateReplies = (replies: Reply[]): Reply[] => {
      return replies.map((r) => {
        if (r.id === replyId) {
          return { ...r, upvotes: r.upvotes + 1 };
        }
        return { ...r, replies: updateReplies(r.replies) };
      });
    };

    return {
      ...thread,
      replies: updateReplies(thread.replies),
      updatedAt: new Date(),
    };
  }

  /**
   * Busca threads por categoria
   */
  static searchThreads(
    threads: Thread[],
    filters: {
      category?: string;
      tags?: string[];
      searchText?: string;
      solved?: boolean;
      sortBy?: 'recent' | 'popular' | 'views';
    }
  ): Thread[] {
    let results = threads;

    if (filters.category) {
      results = results.filter((t) => t.category === filters.category);
    }

    if (filters.tags && filters.tags.length > 0) {
      results = results.filter((t) => filters.tags!.some((tag) => t.tags.includes(tag)));
    }

    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      results = results.filter(
        (t) =>
          t.title.toLowerCase().includes(searchLower) ||
          t.content.toLowerCase().includes(searchLower)
      );
    }

    if (filters.solved !== undefined) {
      results = results.filter((t) => t.solved === filters.solved);
    }

    // Ordenar
    if (filters.sortBy === 'popular') {
      results = results.sort((a, b) => b.upvotes - a.upvotes);
    } else if (filters.sortBy === 'views') {
      results = results.sort((a, b) => b.views - a.views);
    } else {
      results = results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    return results;
  }

  /**
   * Gera estatísticas da comunidade
   */
  static generateCommunityStats(threads: Thread[]): ThreadStats {
    const allReplies = threads.reduce((sum, t) => sum + t.replies.length, 0);
    const uniqueUsers = new Set<string>();
    const contributionMap = new Map<string, number>();

    threads.forEach((thread) => {
      uniqueUsers.add(thread.author.id);
      contributionMap.set(thread.author.id, (contributionMap.get(thread.author.id) || 0) + 1);

      const collectReplies = (replies: Reply[]) => {
        replies.forEach((reply) => {
          uniqueUsers.add(reply.author.id);
          contributionMap.set(reply.author.id, (contributionMap.get(reply.author.id) || 0) + 1);
          collectReplies(reply.replies);
        });
      };

      collectReplies(thread.replies);
    });

    const topContributors = Array.from(contributionMap.entries())
      .map(([userId, contributions]) => ({
        userId,
        userName: `User ${userId.slice(-4)}`,
        contributions,
      }))
      .sort((a, b) => b.contributions - a.contributions)
      .slice(0, 10);

    const tagMap = new Map<string, number>();
    threads.forEach((thread) => {
      thread.tags.forEach((tag) => {
        tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
      });
    });

    const trendingTopics = Array.from(tagMap.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const mostViewedThreads = threads
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);

    return {
      totalThreads: threads.length,
      totalReplies: allReplies,
      activeUsers: uniqueUsers.size,
      topContributors,
      mostViewedThreads,
      trendingTopics,
    };
  }

  /**
   * Gera threads de exemplo
   */
  static generateSampleThreads(): Thread[] {
    return [
      {
        id: 'thread_001',
        title: 'Como começar com cannabis medicinal?',
        content: 'Sou novo em cannabis medicinal e gostaria de saber como começar...',
        author: {
          id: 'user_001',
          name: 'João Silva',
          avatar: 'https://example.com/avatar1.jpg',
          role: 'user',
        },
        category: 'medical',
        tags: ['iniciante', 'cannabis-medicinal', 'saúde'],
        upvotes: 45,
        downvotes: 2,
        replies: [
          {
            id: 'reply_001',
            content: 'Recomendo começar com uma consulta com um especialista...',
            author: {
              id: 'doctor_001',
              name: 'Dr. Carlos',
              avatar: 'https://example.com/avatar2.jpg',
              role: 'doctor',
            },
            upvotes: 32,
            downvotes: 0,
            replies: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            isAnswer: true,
          },
        ],
        views: 234,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        pinned: false,
        solved: true,
        solvedBy: 'reply_001',
      },
      {
        id: 'thread_002',
        title: 'Melhor variedade para insônia?',
        content: 'Estou procurando uma variedade que ajude com insônia...',
        author: {
          id: 'user_002',
          name: 'Maria Santos',
          avatar: 'https://example.com/avatar3.jpg',
          role: 'user',
        },
        category: 'medical',
        tags: ['insônia', 'variedades', 'recomendação'],
        upvotes: 67,
        downvotes: 1,
        replies: [],
        views: 456,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        pinned: true,
        solved: false,
      },
    ];
  }
}
