require('dotenv').config();
const dns = require('dns');
const mongoose = require('mongoose');
const { User, Topic, Article, Comment, Clap, Bookmark } = require('../models');
const { ROLES, ARTICLE_STATUS } = require('../constants');
const { createSlug } = require('../utils/slug');
const TrendingService = require('../services/trending.service');

// Prevent querySrv ECONNREFUSED on Windows and local ISP DNS
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // ignore if restricted
}

const seedData = async () => {
  const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/openfolio';

  try {
    console.log('🔄 Connecting to MongoDB for seeding...');
    await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 8000 });
    console.log('✅ Connected to MongoDB.');

    console.log('🧹 Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Topic.deleteMany({}),
      Article.deleteMany({}),
      Comment.deleteMany({}),
      Clap.deleteMany({}),
      Bookmark.deleteMany({})
    ]);

    console.log('🌱 Seeding Topics...');
    const topics = await Topic.create([
      {
        name: 'Technology',
        slug: 'technology',
        description: 'Emerging tech, hardware, algorithms, and computing paradigms.',
        icon: 'cpu',
        color: '#2563eb',
        isFeatured: true
      },
      {
        name: 'Artificial Intelligence',
        slug: 'artificial-intelligence',
        description: 'LLMs, neural networks, machine learning models, and autonomous agents.',
        icon: 'brain',
        color: '#7c3aed',
        isFeatured: true
      },
      {
        name: 'Web Development',
        slug: 'web-development',
        description: 'Modern frontend, backend architecture, APIs, and web standards.',
        icon: 'code',
        color: '#059669',
        isFeatured: true
      },
      {
        name: 'Design & UX',
        slug: 'design-ux',
        description: 'User experience, product design, aesthetics, and design systems.',
        icon: 'layout',
        color: '#db2777',
        isFeatured: true
      },
      {
        name: 'Cloud & DevOps',
        slug: 'cloud-devops',
        description: 'Kubernetes, serverless, CI/CD pipelines, and cloud resilience.',
        icon: 'cloud',
        color: '#ea580c',
        isFeatured: false
      },
      {
        name: 'Leadership & Startups',
        slug: 'leadership-startups',
        description: 'Founding companies, engineering leadership, and scaling teams.',
        icon: 'trending-up',
        color: '#0891b2',
        isFeatured: true
      }
    ]);

    const topicMap = {};
    topics.forEach((t) => {
      topicMap[t.slug] = t._id;
    });

    console.log('🌱 Seeding Users (Admin, Editor, Authors, Readers)...');
    const admin = await User.create({
      name: 'Openfolio Admin',
      username: 'admin',
      email: 'admin@openfolio.dev',
      password: 'AdminPassword123!',
      role: ROLES.ADMIN,
      bio: 'Openfolio platform administrator & managing editor.',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'
    });

    const editor = await User.create({
      name: 'Elena Rostova',
      username: 'elena_editor',
      email: 'editor@openfolio.dev',
      password: 'EditorPassword123!',
      role: ROLES.EDITOR,
      bio: 'Senior Technology Editor at Openfolio.',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=250&q=80'
    });

    const author1 = await User.create({
      name: 'Dr. Aris Thorne',
      username: 'aristhorne',
      email: 'aris@openfolio.dev',
      password: 'AuthorPassword123!',
      role: ROLES.AUTHOR,
      bio: 'AI researcher and systems architect exploring distributed LLM inference.',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
      website: 'https://aristhorne.dev',
      socialLinks: { twitter: 'aristhorne', github: 'aristhorne' },
      articlesCount: 3,
      followersCount: 340
    });

    const author2 = await User.create({
      name: 'Cassidy Vance',
      username: 'cassidy_codes',
      email: 'cassidy@openfolio.dev',
      password: 'AuthorPassword123!',
      role: ROLES.AUTHOR,
      bio: 'Frontend enthusiast, design systems advocate, and web performance geek.',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80',
      articlesCount: 3,
      followersCount: 512
    });

    const author3 = await User.create({
      name: 'Marcus Sterling',
      username: 'marcus_s',
      email: 'marcus@openfolio.dev',
      password: 'AuthorPassword123!',
      role: ROLES.AUTHOR,
      bio: 'VP of Engineering, angel investor, and writer on high-performance engineering culture.',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
      articlesCount: 2,
      followersCount: 180
    });

    // Reader subscribed to author1 and author2, and topics AI and Web Dev
    const reader = await User.create({
      name: 'Jordan Lee',
      username: 'jordan_reader',
      email: 'reader@openfolio.dev',
      password: 'ReaderPassword123!',
      role: ROLES.READER,
      bio: 'Curious developer reading about modern technology trends.',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80',
      followedAuthors: [author1._id, author2._id],
      followedTopics: [topicMap['artificial-intelligence'], topicMap['web-development']],
      followingCount: 2
    });

    console.log('🌱 Seeding Articles (Featured, Trending, and Regular)...');
    const articles = await Article.create([
      {
        title: 'Building Autonomous Multi-Agent Systems in Node.js',
        slug: createSlug('Building Autonomous Multi-Agent Systems in Node.js'),
        subtitle: 'A blueprint for orchestrating stateful AI agents with asynchronous task graphs.',
        content: `
Artificial intelligence is shifting from single-turn chat interfaces to coordinated networks of autonomous agents. In this deep dive, we explore how to architect scalable multi-agent systems using Node.js and Express.

### 1. The Core Abstraction: Perception, Decision, Action
Every intelligent agent requires a feedback loop. Using Node streams and asynchronous queues, we can model agents that observe environmental changes, invoke LLMs with structured schemas, and emit side-effects.

### 2. State Synchronization and Persistence
When multiple agents collaborate on a complex goal, managing shared memory is critical. We look at using Redis for pub/sub event distribution and MongoDB for snapshotting task graphs.

### Conclusion
Node.js provides an ideal runtime for agentic workflows due to its event-driven I/O and vast ecosystem of protocol drivers.
        `,
        coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
        author: author1._id,
        topics: [topicMap['artificial-intelligence'], topicMap['technology']],
        tags: ['ai', 'nodejs', 'agents', 'architecture'],
        status: ARTICLE_STATUS.PUBLISHED,
        isFeatured: true,
        featuredPriority: 10,
        featuredAt: new Date(),
        viewsCount: 2840,
        clapsCount: 245,
        readingTime: 6,
        publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Mastering Modern CSS: Fluid Typography and Container Queries',
        slug: createSlug('Mastering Modern CSS: Fluid Typography and Container Queries'),
        subtitle: 'Say goodbye to fragile media queries with component-driven responsive layouts.',
        content: `
Responsive design has evolved tremendously. With CSS Container Queries and modern math functions like \`clamp()\`, we can build components that genuinely adapt to their parent container rather than viewport boundaries.

### Why Container Queries Change Everything
Previously, a card component needed modifier classes or complex breakpoint overrides. With \`@container\`, the card formats itself into vertical or horizontal layouts automatically based on its available slot width.

### Fluid Typography Without JavaScript
\`\`\`css
h1 {
  font-size: clamp(2rem, 5vw + 1rem, 4.5rem);
}
\`\`\`
This single line ensures proportional typographic scales across mobile displays, tablets, and ultrawide monitors without jarring step jumps.
        `,
        coverImage: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80',
        author: author2._id,
        topics: [topicMap['web-development'], topicMap['design-ux']],
        tags: ['css', 'frontend', 'web-design', 'responsive'],
        status: ARTICLE_STATUS.PUBLISHED,
        isFeatured: true,
        featuredPriority: 8,
        featuredAt: new Date(),
        viewsCount: 1980,
        clapsCount: 180,
        readingTime: 5,
        publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Scaling Engineering Teams from 10 to 100: What Breaks First',
        slug: createSlug('Scaling Engineering Teams from 10 to 100: What Breaks First'),
        subtitle: 'Lessons learned from high-growth hyper-scale phases in venture-backed tech companies.',
        content: `
Every phase transition in an engineering organization brings predictable failure modes:

1. **Communication Overhead**: What was once a quick hallway conversation turns into endless Slack channels and siloed tribal knowledge.
2. **Architecture Ownership**: When everyone owns everything, nobody owns the database schema migrations or core dependency upgrades.
3. **The Onboarding Tax**: Without rigorous documentation and interactive sandboxes, senior engineers spend 40% of their time answering repetitive setup questions.

Here is the operational framework we instituted to preserve momentum and high developer morale.
        `,
        coverImage: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
        author: author3._id,
        topics: [topicMap['leadership-startups']],
        tags: ['management', 'startups', 'culture', 'scaling'],
        status: ARTICLE_STATUS.PUBLISHED,
        isFeatured: true,
        featuredPriority: 5,
        featuredAt: new Date(),
        viewsCount: 1450,
        clapsCount: 112,
        readingTime: 7,
        publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'The Edge Runtime Revolution: Running Compute Next to Your Users',
        slug: createSlug('The Edge Runtime Revolution: Running Compute Next to Your Users'),
        subtitle: 'How V8 isolates and global edge networks are replacing traditional monolithic servers.',
        content: `
Deploying server-side code globally in milliseconds has transitioned from experimental to production standard. We compare V8 isolate cold-start characteristics versus lightweight container execution.
        `,
        coverImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
        author: author1._id,
        topics: [topicMap['cloud-devops'], topicMap['technology']],
        tags: ['cloud', 'edge', 'serverless', 'infrastructure'],
        status: ARTICLE_STATUS.PUBLISHED,
        isFeatured: false,
        viewsCount: 890,
        clapsCount: 74,
        readingTime: 4,
        publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Design Tokens: Bridging the Gap Between Figma and Production CSS',
        slug: createSlug('Design Tokens: Bridging the Gap Between Figma and Production CSS'),
        subtitle: 'Automating typography, spacing, and color palettes from design files to code repositories.',
        content: `
A modern design system is not a static PDF or isolated component library. It is an automated pipeline that synchronizes tokens across platforms.
        `,
        coverImage: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=1200&q=80',
        author: author2._id,
        topics: [topicMap['design-ux'], topicMap['web-development']],
        tags: ['figma', 'design-tokens', 'ux', 'css'],
        status: ARTICLE_STATUS.PUBLISHED,
        isFeatured: false,
        viewsCount: 650,
        clapsCount: 52,
        readingTime: 4,
        publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
      }
    ]);

    console.log('📈 Calculating trending scores for articles...');
    for (const art of articles) {
      art.trendingScore = TrendingService.calculateScore(art);
      await art.save();
    }

    console.log('💬 Seeding Sample Comments...');
    const parentComment = await Comment.create({
      article: articles[0]._id,
      author: reader._id,
      content: 'Incredible breakdown! How do you handle failure recovery when one agent in the task graph times out?'
    });

    await Comment.create({
      article: articles[0]._id,
      author: author1._id,
      parentComment: parentComment._id,
      content: 'Great question Jordan! We use exponential backoff with dead-letter queues and fallback to human-in-the-loop validation.'
    });

    console.log('👏 Seeding Claps and Bookmarks...');
    await Clap.create({
      user: reader._id,
      article: articles[0]._id,
      count: 25
    });

    await Bookmark.create({
      user: reader._id,
      article: articles[0]._id
    });

    // Update topic article counts
    for (const t of topics) {
      const count = await Article.countDocuments({ topics: t._id, status: ARTICLE_STATUS.PUBLISHED });
      t.articlesCount = count;
      await t.save();
    }

    console.log(`
🎉 ======================================================== 🎉
    Openfolio Database Seeded Successfully!

    Admin Credentials:
    Email:      admin@openfolio.dev
    Password:   AdminPassword123!
    Role:       admin

    Editor Credentials:
    Email:      editor@openfolio.dev
    Password:   EditorPassword123!
    Role:       editor

    Author Credentials:
    Email:      aris@openfolio.dev
    Password:   AuthorPassword123!
    Role:       author

    Reader Credentials:
    Email:      reader@openfolio.dev
    Password:   ReaderPassword123!
    Role:       reader
🎉 ======================================================== 🎉
    `);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    if (error.message.includes('Could not connect to any servers') || error.message.includes('whitelist')) {
      console.error('\n🔒 IP Whitelist Notice:');
      console.error('Your IP address is not whitelisted in MongoDB Atlas.');
      console.error('1. Log in to MongoDB Atlas: https://cloud.mongodb.com');
      console.error('2. Go to "Security" -> "Network Access"');
      console.error('3. Click "+ ADD IP ADDRESS"');
      console.error('4. Click "ALLOW ACCESS FROM ANYWHERE" (0.0.0.0/0) or add your current IP address.');
      console.error('5. Click Confirm, wait ~1 minute for status to become "Active", and run "npm run seed" again.\n');
    }
    process.exit(1);
  }
};

seedData();
