const express = require('express');

const app = express();

app.get('/healthcheck', (_req, res) => {
  return res.status(200).json({
    is_healthy: true
  });
});

app.listen(3001, () => {
  console.log('Server listening at port 3001');
});
