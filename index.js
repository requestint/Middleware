// ── Libraries ────────────────────────────────────────
import express   from 'express'
import rateLimit from 'express-rate-limit'
import crypto    from 'crypto'

// ── App ──────────────────────────────────────────────
const app = express()
app.use(express.json({ limit: '16kb' }))

// ── Constants ────────────────────────────────────────
const SECRET_KEY   = process.env.SECRET_KEY
const PORT         = process.env.PORT || 3000
const POLL_TIMEOUT = 5000   // 5s max hold
const CMD_TTL      = 60000   // commands expire after 60s


// ── State ─────────────────────────────────────────────
let commandQueue  = []   // pending commands waiting for Roblox
let pollResolvers = []   // waiting long poll connections

// ── Rate Limiting ─────────────────────────────────────
app.set("trust proxy", 1)
app.use(rateLimit({
    windowMs : 60 * 1000,
    max      : 600,
    message  : { error: 'Too many requests' }
}))

// ── Auth ──────────────────────────────────────────────
const auth = (req, res, next) => {
    console.log('received key:', req.headers['api-key'])
    console.log('expected key:', SECRET_KEY)
    
    if (req.headers['api-key'] !== SECRET_KEY) {
        return res.status(401).json({ error: 'Unauthorized' })
    }
    next()
}
// ── Helpers ───────────────────────────────────────────

// wake any long poll connections immediately when new data arrives
const notifyPollers = () => {
    if (pollResolvers.length === 0) return
    const toNotify = pollResolvers
    pollResolvers  = []
    for (const resolve of toNotify) resolve()
}

// remove commands older than CMD_TTL
const pruneExpired = () => {
    const now    = Date.now()
    commandQueue = commandQueue.filter(cmd =>
        now - cmd.timestamp < CMD_TTL
    )
}

// ── Routes ────────────────────────────────────────────

// Discord or any external source sends commands here
// Roblox picks them up via /get-commands
app.post('/send-command', auth, (req, res) => {
    const { type, UserId, payload } = req.body

    console.log('📨 Incoming command:', req.body)

    if (!type || !UserId) {
        return res.status(400).json({
            error    : 'Missing required fields',
            required : ['type', 'UserId']
        })
    }

    const command = {
        id        : crypto.randomUUID(),
        timestamp : Date.now(),
        type      : type,
        UserId    : UserId,
        payload   : payload ?? {}
    }

    commandQueue.push(command)
    console.log('✅ Queued command:', command)

    notifyPollers()

    return res.status(200).json({ ok: true, id: command.id })
})

// Roblox long polls here
// server holds connection until data arrives
app.get('/get-commands', auth, async (req, res) => {
    pruneExpired()

    // data already waiting — send immediately
    if (commandQueue.length > 0) {
        const commands = [...commandQueue]
        commandQueue   = []
        console.log(`📤 Sending ${commands.length} command(s) immediately`)
        return res.json({ ok: true, commands })
    }

    // nothing yet — hold connection open
    console.log('⏳ Holding connection, waiting for commands...')

    await new Promise(resolve => {
        pollResolvers.push(resolve)
        setTimeout(() => {
            pollResolvers = pollResolvers.filter(r => r !== resolve)
            resolve()
        }, POLL_TIMEOUT)
    })

    pruneExpired()

    const commands = [...commandQueue]
    commandQueue   = []

    console.log(`📤 Sending ${commands.length} command(s) after wait`)
    return res.json({ ok: true, commands })
})

// Roblox sends events back here
// placeholder for Discord bot integration later
app.post('/roblox-event', auth, (req, res) => {
    const { type, UserId, payload } = req.body

    console.log('🎮 Roblox event received:', req.body)

    if (!type || !UserId) {
        return res.status(400).json({
            error    : 'Missing required fields',
            required : ['type', 'UserId']
        })
    }

    // TODO: forward to Discord bot when added
    console.log(`📡 Event — type: ${type} UserId: ${UserId}`)

    return res.status(200).json({ ok: true })
})

// health check
app.get('/ping', auth, (req, res) => {
    res.json({
        ok     : true,
        queued : commandQueue.length,
        uptime : process.uptime()
    })
})

// ── Start ─────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`✅ Middleware running on port ${PORT}`)
    console.log(`🔑 Auth: ${SECRET_KEY ? 'configured' : 'WARNING: SECRET_KEY not set'}`)
})
