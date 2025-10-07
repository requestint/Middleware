const express = require('express');
const app = express();
app.use(express.json());

let commandQueue = [];

app.post('/send-command', (req, res) => {
  const { type, username } = req.body;
  
  if (!type || !username) return res.status(400).send('Missing fields');
  commandQueue.push({ type, username });
  res.sendStatus(200);
});

app.get('/get-commands', (req, res) => {
  const commands = [...commandQueue];
  commandQueue = [];
  res.json(commands);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));