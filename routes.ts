import { z } from 'zod';
import { insertConversationSchema, insertMessageSchema, conversations, messages } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  conversations: {
    list: {
      method: 'GET' as const,
      path: '/api/conversations' as const,
      responses: {
        200: z.array(z.custom<typeof conversations.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/conversations/:id' as const,
      responses: {
        200: z.object({
          ...conversations.$inferSelect,
          messages: z.array(z.custom<typeof messages.$inferSelect>()),
        }),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/conversations' as const,
      input: z.object({
        title: z.string().optional(),
      }),
      responses: {
        201: z.custom<typeof conversations.$inferSelect>(),
        500: errorSchemas.internal,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/conversations/:id' as const,
      responses: {
        204: z.void(),
        500: errorSchemas.internal,
      },
    },
  },
  messages: {
    create: {
      method: 'POST' as const,
      path: '/api/conversations/:id/messages' as const,
      input: z.object({
        content: z.string(),
      }),
      responses: {
        // Since it's SSE, the normal response isn't a simple JSON object
        // but we define the final shape or acknowledge the streaming nature
        200: z.any(), 
      },
    },
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
