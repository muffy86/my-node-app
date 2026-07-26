const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    name: 'my-node-app',
    version: '1.0.0',
    description: 'Sample Node.js app',
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    env: process.env.NODE_ENV || 'development',
  });
});

module.exports = router;
