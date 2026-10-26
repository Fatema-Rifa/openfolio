# 📖 Openfolio — Multi-Author Publication Platform Backend

Openfolio is a modern, production-grade backend for multi-author publication platforms (similar to Medium, Dev.to, and Substack). Built with **Node.js**, **Express.js**, and **MongoDB with Mongoose**, it features author subscriptions, personalized discovery feeds, curated featured posts, real-time trending algorithms with engagement decay, and a comprehensive admin management dashboard.

---

## 🚀 Key Features

- **👥 Multi-Author System & Profiles**: Public author profiles, bios, avatars, social links, and follower counts.
- **🔔 Author Subscriptions (Follow System)**: Readers can subscribe to their favorite authors and follow interest topics.
- **📰 Personalized Feeds**: Dynamic algorithmic feed aggregating followed authors, subscribed topics, and high-engagement recommendations with cold-start fallbacks.
- **⭐ Featured Posts**: Curated hero articles and editorial picks with priority ordering.
- **🔥 Trending Articles**: Hacker News gravity decay algorithm weighting views, claps, comments, and bookmarks over time:
  $$\text{Score} = \frac{\text{Views} \times 1 + \text{Claps} \times 3 + \text{Comments} \times 4 + \text{Bookmarks} \times 2}{(\text{Hours Since Published} + 2)^{1.5}}$$
- **🛡️ Admin Dashboard**: Full admin oversight including real-time KPI metrics, user moderation (role promotion/demotion, account suspensions), article moderation, and feature toggling.
- **👏 Medium-Style Claps**: Readers can clap up to 50 times per article.
- **🔖 Reading List / Bookmarks**: Save articles for later reading.
- **💬 Threaded Discussion**: Nested comments and replies.
- **📚 Interactive Swagger / OpenAPI 3.0**: Fully documented interactive API at `/api/docs`.

---

## 🛠️ Architecture & Tech Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens) + Bcrypt password hashing
- **Authorization**: Role-Based Access Control (`reader`, `author`, `editor`, `admin`)
- **Validation**: Zod schema validation
- **Security**: Helmet, CORS, and Express-Rate-Limit
- **Documentation**: Swagger UI & OpenAPI 3.0 specification

---

## 📁 Project Structure

```
openfolio/
├── src/
│   ├── app.js                   # Express app setup, middleware, swagger
│   ├── config/
│   │   ├── db.js                # MongoDB connection handler
│   │   └── swagger.js           # OpenAPI 3.0 specification
│   ├── constants/
│   │   └── index.js             # User roles, article status, sort enums
│   ├── controllers/
│   │   ├── auth.controller.js   # Register, login, profile, password
│   │   ├── user.controller.js   # Author subscriptions, followers, bookmarks
│   │   ├── article.controller.js# Publishing, claps, bookmarks, search
│   │   ├── feed.controller.js   # Personalized, following & topic feeds
│   │   ├── topic.controller.js  # Topic category management
│   │   ├── comment.controller.js# Nested comments and replies
│   │   └── admin.controller.js  # Dashboard KPIs, user & article moderation
│   ├── middlewares/
│   │   ├── auth.middleware.js   # Protect, optionalAuth, authorize(roles)
│   │   ├── error.middleware.js  # Centralized error handler
│   │   ├── validate.middleware.js # Zod schema validator
│   │   └── rateLimiter.middleware.js # Rate limiting protection
│   ├── models/
│   │   ├── User.js              # Author profile, subscriptions, roles
│   │   ├── Article.js           # Content, slug, featured, trending scores
│   │   ├── Topic.js             # Category tags and followers
│   │   ├── Clap.js              # Medium-style claps (1-50)
│   │   ├── Bookmark.js          # Reading list
│   │   └── Comment.js           # Threaded comments & replies
│   ├── routes/
│   │   ├── index.js             # API v1 router aggregator
│   │   ├── auth.routes.js       # /api/v1/auth
│   │   ├── user.routes.js       # /api/v1/users
│   │   ├── article.routes.js    # /api/v1/articles
│   │   ├── feed.routes.js       # /api/v1/feed
│   │   ├── topic.routes.js      # /api/v1/topics
│   │   ├── comment.routes.js    # /api/v1/comments
│   │   └── admin.routes.js      # /api/v1/admin
│   ├── services/
│   │   ├── feed.service.js      # Personalized feed engine
│   │   ├── trending.service.js  # Decay algorithm & score recalculator
│   │   └── stats.service.js     # Admin KPI metrics aggregator
│   ├── utils/
│   │   ├── apiError.js          # Custom operational error class
│   │   ├── apiResponse.js       # Standardized response wrapper
│   │   ├── readingTime.js       # Read time calculator (WPM based)
│   │   └── slug.js              # URL slug generator
│   ├── validators/
│   │   ├── auth.validator.js
│   │   ├── article.validator.js
│   │   ├── topic.validator.js
│   │   └── admin.validator.js
│   └── scripts/
│       └── seed.js              # Realistic seed data script
├── .env.example
├── .env
├── package.json
├── index.js                     # Server entrypoint
└── README.md
```

---

## ⚡ Quick Start

### 1. Prerequisites
- **Node.js** (v18.0.0 or higher)
- **MongoDB** running locally (`mongodb://localhost:27017`) or a MongoDB Atlas URI

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Verify or customize your `.env` file:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/openfolio
JWT_SECRET=supersecret_openfolio_jwt_key_2026_change_in_production
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
```

### 4. Seed the Database
Populate the database with realistic sample topics, authors, published articles, claps, comments, and predefined user roles:
```bash
npm run seed
```

### 5. Start Development Server
```bash
npm run dev
# or for production
npm start
```

---

## 🔑 Seed User Credentials

After running `npm run seed`, you can immediately test the platform using these accounts:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@openfolio.dev` | `AdminPassword123!` | Dashboard stats, user moderation, role assignments, feature curation |
| **Editor** | `editor@openfolio.dev` | `EditorPassword123!` | Dashboard stats, article moderation, topic management |
| **Author** | `aris@openfolio.dev` | `AuthorPassword123!` | Publish & edit articles, view own metrics |
| **Reader** | `reader@openfolio.dev` | `ReaderPassword123!` | Subscribe to authors, claps, bookmarks, comments |

---

## 📑 API Documentation & Endpoints

Open your browser to inspect and execute queries interactively via **Swagger UI**:
👉 **`http://localhost:5000/api/docs`**

Raw OpenAPI JSON specification:
👉 **`http://localhost:5000/api/docs.json`**

### Summary of Core Endpoints

#### 1. Authentication (`/api/v1/auth`)
- `POST /register` — Create account (`name`, `username`, `email`, `password`, `bio`)
- `POST /login` — Login with username/email & password, returns JWT token
- `GET  /me` — Get current profile with followed authors and topics (Bearer Auth)
- `PUT  /profile` — Update avatar, bio, website, social links
- `PUT  /change-password` — Change password

#### 2. Author Subscriptions & Users (`/api/v1/users`)
- `POST   /:username/follow` — **Subscribe to an author**
- `DELETE /:username/follow` — **Unsubscribe from an author**
- `GET    /:username` — Public author profile with follower counts & subscription state
- `GET    /:username/followers` — List author's subscribers
- `GET    /:username/following` — List authors followed by this user
- `POST   /topics/:topicSlug/follow` — Follow a topic for feed personalization
- `DELETE /topics/:topicSlug/follow` — Unfollow a topic
- `GET    /me/bookmarks` — Retrieve user's saved reading list

#### 3. Feeds (`/api/v1/feed`)
- `GET /personalized` — **Personalized Feed** combining followed authors, followed topics, and recommendations
- `GET /following` — **Following Feed** strictly showing articles from subscribed authors
- `GET /topic/:slug` — Dedicated feed for a specific topic (sortable by `latest`, `trending`, `popular`)

#### 4. Articles (`/api/v1/articles`)
- `GET    /featured` — **Featured posts** (hero spotlight and editorial list)
- `GET    /trending` — **Trending articles** ranked by engagement decay algorithm
- `GET    /` — Browse & search articles (supports `topic`, `tag`, `author`, `search`, `sort`)
- `POST   /` — Publish new article (Author, Editor, Admin)
- `GET    /:slug` — Read article (records view and checks if user clapped/saved)
- `PUT    /:slug` — Edit article (Author or Editor/Admin)
- `DELETE /:slug` — Delete article
- `POST   /:slug/clap` — Clap for article (1-50 claps)
- `POST   /:slug/bookmark` — Toggle article in reading list
- `GET    /:slug/comments` — Read nested comments and replies
- `POST   /:slug/comments` — Post a comment or reply to a comment

#### 5. Admin Dashboard (`/api/v1/admin`)
- `GET    /dashboard` — **Admin Dashboard KPIs**:
  - Total users, authors, 7-day user growth rate
  - Total articles (published vs drafts vs featured)
  - Total views, claps, bookmarks, comments, average reading time
  - Top 5 authors and top topics
- `GET    /users` — User administration (search by name/email, filter by role/banned status)
- `PATCH  /users/:userId/role` — Promote or demote user role (`reader`, `author`, `editor`, `admin`)
- `PATCH  /users/:userId/ban` — Suspend or reinstate user accounts
- `GET    /articles` — Moderation view of all articles across draft/published/archived
- `PATCH  /articles/:articleId/feature` — **Toggle Featured status** (`isFeatured: true/false`, priority)
- `DELETE /articles/:articleId` — Force delete offensive or spam articles
- `POST   /recalculate-trending` — Trigger manual batch recalculation of trending scores

---

## 🧪 Testing with cURL / HTTP Clients

### Login as Reader:
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"emailOrUsername": "reader@openfolio.dev", "password": "ReaderPassword123!"}'
```

### Get Personalized Feed:
```bash
curl -X GET http://localhost:5000/api/v1/feed/personalized \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

### Subscribe to an Author:
```bash
curl -X POST http://localhost:5000/api/v1/users/aristhorne/follow \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

### Get Trending Articles:
```bash
curl -X GET http://localhost:5000/api/v1/articles/trending
```

### Get Admin Dashboard Stats (Admin Token):
```bash
curl -X GET http://localhost:5000/api/v1/admin/dashboard \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```
