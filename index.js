// Libraries
import express from 'express';

// Varibles
const app = express();

// INSTANT ACTIONS
app.use(express.json());


// Array's
let commandQueue = [];


// Functions
app.post('/send-command', (req, res) => {
  const data = req.body; // no destructuring

  console.log('📩 Incoming request:', data);

  // Basic validation — ensure it's not empty
  if (Object.keys(data).length === 0) {
    return res.status(400).send('Missing fields');
  }
  
  commandQueue.push(data);
  console.log('✅ Added command to queue:', data);

  res.sendStatus(200);
});



app.get('/get-commands', (req, res) => {

  // copy queue before clearing
  const commands = [...commandQueue];

  console.log('📤 Sending queued commands:', commands);

  await sleep(2000);
  
  // clear queue after sending
  commandQueue = [];

  res.json(commands);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Middleware server running on port ${PORT}`));
