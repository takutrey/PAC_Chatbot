const express = require('express');
const { getWebhook, postWebhook } = require('../controllers/WebhookControllers');
const router = express.Router(); 

//webhook routes
router.get('/webhook', getWebhook);
router.post('/webhook', postWebhook);


module.exports = router;