const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;

app.get('/hello', (req, res) => {
  res.send('Hello, DevOps World!');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

