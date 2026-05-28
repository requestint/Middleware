// ── Libraries ────────────────────────────────────────
import express   from 'express'
import rateLimit from 'express-rate-limit'
import crypto    from 'crypto'

// ── App ──────────────────────────────────────────────
const app = express()

// limit body size to 16kb matching your Config.MAX_BODY_SIZE
app.use(express.json({ limit: '16kb' }))

// ── Constants ────────────────────────────────────────
const SECRET_KEY     = process.env.SECRET_KEY
const SERVER_SECRET  = process.env.SERVER_SECRET
const PORT           = process.env.PORT || 3000
const POLL_TIMEOUT   = 25000  // 25s max hold matching Config.TIMEOUT
const CMD_TTL        = 60000  // commands expire after 60s

// ── State ────────────────────────────────────────────
let commandQueue   = []   // pending commands waiting to be picked up
let pollResolvers  = []   // waiting long poll connections

// ── Rate Limiting ────────────────────────────────────
const limiter = rateLimit({
    windowMs : 60 * 1000,  // 1 minute
    max      : 600,        // per IP
    message  : { error: 'Too many requests' }
})

app.use(limiter)

// ── Auth Middleware ───────────────────────────────────
const authWorker = (req, res, next) => {
    // requests from Cloudflare Worker use x-api-key
    if (req.headers['x-api-key'] !== SECRET_KEY) {
        return res.status(401).json({ error: 'Unauthorized' })
    }
    next()
}

const authServer = (req, res, next) => {
    // requests from your own server logic use server secret
    if (req.headers['x-server-secret'] !== SERVER_SECRET) {
        return res.status(401).json({ error: 'Unauthorized' })
    }
    next()
}

// ── Helpers ───────────────────────────────────────────

// notify any waiting long poll connections that new data arrived
const notifyPollers = () => {
    if (pollResolvers.length === 0) return

    const toNotify  = pollResolvers
    pollResolvers   = []

    for (const resolve of toNotify) {
        resolve()
    }
}

// remove expired commands so stale data never gets sent
const pruneExpired = () => {
    const now = Date.now()
    commandQueue = commandQueue.filter(cmd => 
        now - cmd.timestamp < CMD_TTL
    )
}

// ── Routes ────────────────────────────────────────────

// Roblox or Cloudflare Worker sends commands here
app.post('/send-command', authWorker, (req, res) => {
    const data = req.body

    if (!data || Object.keys(data).length === 0) {
        return res.status(400).json({ error: 'Missing fields' })
    }

    // attach id and timestamp so we can track and expire it
    const command = {
        id        : crypto.randomUUID(),
        timestamp : Date.now(),
        ...data
    }

    commandQueue.push(command)

    console.log(`[send-command] queued ${command.id}`)

    // wake any waiting long poll connections immediately
    notifyPollers()

    return res.status(200).json({ id: command.id })
})

// Roblox polls here — server holds connection until data arrives
app.get('/get-commands', authWorker, async (req, res) => {
    // clean expired commands first
    pruneExpired()

    // if there are already commands waiting send immediately
    if (commandQueue.length > 0) {
        const commands  = [...commandQueue]
        commandQueue    = []

        console.log(`[get-commands] sending ${commands.length} commands immediately`)
        return res.json(commands)
    }

    // nothing yet — hold the connection open
    // resolves when notifyPollers() fires or timeout hits
    console.log('[get-commands] holding connection, waiting for commands...')

    await new Promise(resolve => {
        pollResolvers.push(resolve)

        // timeout after 25s — send empty array
        // Roblox will reconnect immediately
        setTimeout(() => {
            pollResolvers = pollResolvers.filter(r => r !== resolve)
            resolve()
        }, POLL_TIMEOUT)
    })

    // check again after waking up
    pruneExpired()

    const commands  = [...commandQueue]
    commandQueue    = []

    console.log(`[get-commands] sending ${commands.length} commands after wait`)
    return res.json(commands)
})

// health check — lets you verify the server is alive
app.get('/ping', (req, res) => {
    res.json({ ok: true, queued: commandQueue.length })
})

// ── Start ─────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`Middleware server running on port ${PORT}`)
})
