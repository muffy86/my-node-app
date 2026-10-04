const express = require('express');
const router = express.Router();

// In-memory user store
const users = [];
let nextId = 1;

// GET /api/users — list all users
router.get('/', (req, res) => {
  res.json({ users });
});

// GET /api/users/:id — fetch a single user
router.get('/:id', (req, res) => {
  const user = users.find((u) => u.id === parseInt(req.params.id, 10));

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  res.json({ user });
});

// POST /api/users — create a new user
router.post('/', (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    const error = new Error('Name and email are required');
    error.statusCode = 400;
    throw error;
  }

  const user = { id: nextId++, name, email };
  users.push(user);

  res.status(201).json({ user });
});

module.exports = router;
