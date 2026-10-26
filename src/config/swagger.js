const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Openfolio API - Multi-Author Publication Platform',
      version: '1.0.0',
      description: `
**Openfolio** is a multi-author publication platform backend built with Express.js and MongoDB.

### Key Features:
- **Author Subscriptions**: Follow and subscribe to authors, view follower networks.
- **Personalized Feeds**: Customized content delivery aggregating followed authors, followed topics, and recommendations.
- **Featured Posts**: Curated hero and top editorial highlights.
- **Trending Articles**: Hacker News gravity decay algorithm weighting views, claps, comments, and bookmarks over time.
- **Admin Dashboard**: Comprehensive analytics, user role control, content moderation, and featured post controls.
- **Engagement**: Claps (1-50 per reader), reading list bookmarks, nested threaded comments.
      `,
      contact: {
        name: 'Openfolio Engineering Team'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000/api/v1',
        description: 'Local Development Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token obtained from /auth/login or /auth/register'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '65f1a2b3c4d5e6f7a8b9c0d1' },
            name: { type: 'string', example: 'Alex Morgan' },
            username: { type: 'string', example: 'alexmorgan' },
            email: { type: 'string', format: 'email', example: 'alex@example.com' },
            role: { type: 'string', enum: ['reader', 'author', 'editor', 'admin'], example: 'author' },
            avatar: { type: 'string', example: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde' },
            bio: { type: 'string', example: 'Full-stack software architect & tech essayist.' },
            followersCount: { type: 'integer', example: 124 },
            followingCount: { type: 'integer', example: 45 },
            articlesCount: { type: 'integer', example: 12 }
          }
        },
        Article: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string', example: 'The Future of Distributed Systems in 2026' },
            slug: { type: 'string', example: 'the-future-of-distributed-systems-in-2026' },
            subtitle: { type: 'string', example: 'How decentralized state machines and edge nodes are reshaping computing.' },
            content: { type: 'string', example: 'Full markdown or rich text article body...' },
            coverImage: { type: 'string', example: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643' },
            author: { $ref: '#/components/schemas/User' },
            topics: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string', example: 'Engineering' },
                  slug: { type: 'string', example: 'engineering' }
                }
              }
            },
            tags: { type: 'array', items: { type: 'string' }, example: ['nodejs', 'architecture'] },
            status: { type: 'string', enum: ['draft', 'published', 'archived'] },
            isFeatured: { type: 'boolean', example: true },
            readingTime: { type: 'integer', example: 6 },
            viewsCount: { type: 'integer', example: 1420 },
            clapsCount: { type: 'integer', example: 88 },
            trendingScore: { type: 'number', example: 42.5 },
            publishedAt: { type: 'string', format: 'date-time' }
          }
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            statusCode: { type: 'integer', example: 200 },
            message: { type: 'string', example: 'Success' },
            data: { type: 'object' },
            meta: {
              type: 'object',
              properties: {
                page: { type: 'integer', example: 1 },
                limit: { type: 'integer', example: 10 },
                total: { type: 'integer', example: 50 },
                totalPages: { type: 'integer', example: 5 }
              }
            }
          }
        }
      }
    },
    paths: {
      '/auth/register': {
        post: {
          summary: 'Register a new user',
          tags: ['Authentication'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'username', 'email', 'password'],
                  properties: {
                    name: { type: 'string', example: 'Sarah Connor' },
                    username: { type: 'string', example: 'sarahc' },
                    email: { type: 'string', format: 'email', example: 'sarah@example.com' },
                    password: { type: 'string', minLength: 6, example: 'secret123' },
                    bio: { type: 'string', example: 'Writing about AI and cybersecurity' }
                  }
                }
              }
            }
          },
          responses: { 201: { description: 'Registration successful' } }
        }
      },
      '/auth/login': {
        post: {
          summary: 'Login user and get JWT token',
          tags: ['Authentication'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['emailOrUsername', 'password'],
                  properties: {
                    emailOrUsername: { type: 'string', example: 'sarah@example.com' },
                    password: { type: 'string', example: 'secret123' }
                  }
                }
              }
            }
          },
          responses: { 200: { description: 'Login successful' } }
        }
      },
      '/auth/me': {
        get: {
          summary: 'Get current user profile',
          tags: ['Authentication'],
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'User profile retrieved' } }
        }
      },
      '/feed/personalized': {
        get: {
          summary: 'Get personalized feed based on followed authors and topics',
          tags: ['Feeds'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } }
          ],
          responses: { 200: { description: 'Personalized articles feed' } }
        }
      },
      '/feed/following': {
        get: {
          summary: 'Get articles strictly from authors the user is subscribed to',
          tags: ['Feeds'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } }
          ],
          responses: { 200: { description: 'Articles from followed authors' } }
        }
      },
      '/articles/featured': {
        get: {
          summary: 'Get featured hero and curated articles for the publication',
          tags: ['Articles'],
          parameters: [
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 5 } }
          ],
          responses: { 200: { description: 'Featured articles' } }
        }
      },
      '/articles/trending': {
        get: {
          summary: 'Get trending articles ranked by engagement decay algorithm',
          tags: ['Articles'],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } }
          ],
          responses: { 200: { description: 'Trending articles list' } }
        }
      },
      '/articles': {
        get: {
          summary: 'Browse and search articles with filtering',
          tags: ['Articles'],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
            { name: 'topic', in: 'query', schema: { type: 'string' } },
            { name: 'tag', in: 'query', schema: { type: 'string' } },
            { name: 'search', in: 'query', schema: { type: 'string' } },
            { name: 'sort', in: 'query', schema: { type: 'string', enum: ['latest', 'trending', 'popular', 'claps'] } }
          ],
          responses: { 200: { description: 'Articles list' } }
        },
        post: {
          summary: 'Publish or save new article',
          tags: ['Articles'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title', 'content'],
                  properties: {
                    title: { type: 'string', example: 'Building Scalable Node.js Microservices' },
                    subtitle: { type: 'string', example: 'A practical guide to event-driven architectures' },
                    content: { type: 'string', example: 'Deep dive content here...' },
                    coverImage: { type: 'string' },
                    topics: { type: 'array', items: { type: 'string' }, example: ['technology'] },
                    tags: { type: 'array', items: { type: 'string' }, example: ['nodejs', 'express'] },
                    status: { type: 'string', enum: ['draft', 'published'], default: 'published' }
                  }
                }
              }
            }
          },
          responses: { 201: { description: 'Article created successfully' } }
        }
      },
      '/articles/{slug}': {
        get: {
          summary: 'Get single article by slug (increments view count and tracks user claps/bookmarks)',
          tags: ['Articles'],
          parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Article details' } }
        },
        put: {
          summary: 'Update existing article',
          tags: ['Articles'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Article updated' } }
        },
        delete: {
          summary: 'Delete article',
          tags: ['Articles'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Article deleted' } }
        }
      },
      '/articles/{slug}/clap': {
        post: {
          summary: 'Clap for an article (1 to 50 claps)',
          tags: ['Articles'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { count: { type: 'integer', default: 1, minimum: 1, maximum: 50 } }
                }
              }
            }
          },
          responses: { 200: { description: 'Clap recorded' } }
        }
      },
      '/articles/{slug}/bookmark': {
        post: {
          summary: 'Toggle bookmark / save to reading list',
          tags: ['Articles'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Bookmark toggled' } }
        }
      },
      '/articles/{slug}/comments': {
        get: {
          summary: 'Get comments and threaded replies for an article',
          tags: ['Comments'],
          parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Threaded comments' } }
        },
        post: {
          summary: 'Post a comment or reply to an article',
          tags: ['Comments'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['content'],
                  properties: {
                    content: { type: 'string', example: 'Fascinating perspective on distributed consensus!' },
                    parentComment: { type: 'string', description: 'ID of parent comment if replying' }
                  }
                }
              }
            }
          },
          responses: { 201: { description: 'Comment posted' } }
        }
      },
      '/users/{username}/follow': {
        post: {
          summary: 'Subscribe to an author',
          tags: ['Author Subscriptions'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'username', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Subscribed to author' } }
        },
        delete: {
          summary: 'Unsubscribe from an author',
          tags: ['Author Subscriptions'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'username', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Unsubscribed from author' } }
        }
      },
      '/users/{username}': {
        get: {
          summary: 'Get public author profile',
          tags: ['Authors'],
          parameters: [{ name: 'username', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Author profile' } }
        }
      },
      '/users/topics/{topicSlug}/follow': {
        post: {
          summary: 'Follow a topic to personalize feeds',
          tags: ['Author Subscriptions'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'topicSlug', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Topic followed' } }
        },
        delete: {
          summary: 'Unfollow a topic',
          tags: ['Author Subscriptions'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'topicSlug', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Topic unfollowed' } }
        }
      },
      '/users/me/bookmarks': {
        get: {
          summary: 'Get user saved reading list',
          tags: ['Users'],
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Saved articles' } }
        }
      },
      '/admin/dashboard': {
        get: {
          summary: 'Get Admin Dashboard KPIs and analytics overview',
          tags: ['Admin Dashboard'],
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Dashboard stats and metrics' } }
        }
      },
      '/admin/users': {
        get: {
          summary: 'Admin: Search and list users with role and ban filters',
          tags: ['Admin Dashboard'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'role', in: 'query', schema: { type: 'string' } },
            { name: 'isBanned', in: 'query', schema: { type: 'boolean' } },
            { name: 'search', in: 'query', schema: { type: 'string' } },
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } }
          ],
          responses: { 200: { description: 'List of users' } }
        }
      },
      '/admin/users/{userId}/role': {
        patch: {
          summary: 'Admin: Promote or demote user role',
          tags: ['Admin Dashboard'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['role'],
                  properties: { role: { type: 'string', enum: ['reader', 'author', 'editor', 'admin'] } }
                }
              }
            }
          },
          responses: { 200: { description: 'User role updated' } }
        }
      },
      '/admin/users/{userId}/ban': {
        patch: {
          summary: 'Admin: Suspend or unban a user',
          tags: ['Admin Dashboard'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['isBanned'],
                  properties: { isBanned: { type: 'boolean' } }
                }
              }
            }
          },
          responses: { 200: { description: 'User ban status changed' } }
        }
      },
      '/admin/articles': {
        get: {
          summary: 'Admin: Moderation list of all articles across draft/published/archived',
          tags: ['Admin Dashboard'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'status', in: 'query', schema: { type: 'string' } },
            { name: 'isFeatured', in: 'query', schema: { type: 'boolean' } },
            { name: 'search', in: 'query', schema: { type: 'string' } }
          ],
          responses: { 200: { description: 'Articles list for moderation' } }
        }
      },
      '/admin/articles/{articleId}/feature': {
        patch: {
          summary: 'Admin: Mark article as featured or remove from featured',
          tags: ['Admin Dashboard'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'articleId', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['isFeatured'],
                  properties: {
                    isFeatured: { type: 'boolean' },
                    featuredPriority: { type: 'integer', default: 0 }
                  }
                }
              }
            }
          },
          responses: { 200: { description: 'Article featured status updated' } }
        }
      },
      '/admin/recalculate-trending': {
        post: {
          summary: 'Admin: Trigger manual recalculation of article trending scores',
          tags: ['Admin Dashboard'],
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Scores recalculated' } }
        }
      }
    }
  },
  apis: []
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
