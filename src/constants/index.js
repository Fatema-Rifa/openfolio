const ROLES = {
  READER: 'reader',
  AUTHOR: 'author',
  EDITOR: 'editor',
  ADMIN: 'admin'
};

const ARTICLE_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived'
};

const SORT_OPTIONS = {
  LATEST: 'latest',
  TRENDING: 'trending',
  POPULAR: 'popular',
  TOP: 'top'
};

module.exports = {
  ROLES,
  ARTICLE_STATUS,
  SORT_OPTIONS
};
