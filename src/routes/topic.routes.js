const express = require('express');
const router = express.Router();
const topicController = require('../controllers/topic.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { ROLES } = require('../constants');
const { createTopicSchema, updateTopicSchema } = require('../validators/topic.validator');

router.get('/', topicController.getTopics);
router.get('/:slug', topicController.getTopicBySlug);

router.post(
  '/',
  protect,
  authorize(ROLES.EDITOR, ROLES.ADMIN),
  validate(createTopicSchema),
  topicController.createTopic
);

router.put(
  '/:slug',
  protect,
  authorize(ROLES.EDITOR, ROLES.ADMIN),
  validate(updateTopicSchema),
  topicController.updateTopic
);

router.delete(
  '/:slug',
  protect,
  authorize(ROLES.ADMIN),
  topicController.deleteTopic
);

module.exports = router;
