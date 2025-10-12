const express = require('express');
const app = express();
app.use(express.json());

let commandQueue = [];


app.post('/send-command', (req, res) => {
  const { type, username, length, PlaceId } = req.body;
  
  if (!type || !username || !PlaceId) return res.status(400).send('Missing fields');
  commandQueue.push({ type, username, length, PlaceId });

  console.log(`Port ${3000} Remote Session Request : ` + JSON.stringify(req.body))
  res.sendStatus(200);
});

app.get('/get-commands', (req, res) => {


  console.log(`Port ${3000} Remote Session Request : ` + JSON.stringify(req.body))

  const commands = [...commandQueue];
  commandQueue = [];
  res.json(commands);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
