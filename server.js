const express = require('express')
const createError = require('http-errors')
const morgan = require('morgan')
const { Client, LocalAuth } = require('whatsapp-web.js')
const qrcode = require('qrcode-terminal')
const fs = require('fs')
const app = require('./app.js')
const router = express.Router()
const cors = require('cors')

app.use(cors());

require('dotenv').config()

app.get('/api/login', (req, res) => {
  const { cleantIDMofo } = req.body
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders(); // flush the headers to establish SSE with client
  console.log('streaming');

  // const client = new Client()
  const client = new Client({
    authStrategy: new LocalAuth({ clientId: 'client100' }),
  })

  client.initialize()
  
  const loadingMessage = {
    message: 'loading_qr'
  }

  res.write(`data: ${JSON.stringify(loadingMessage)}\n\n`);

  client.on('qr', (qr) => {
    // NOTE: This event will not be fired if a session is specified.
    console.log('QR RECEIVED', qr)
    // qrcode.generate(qr, { small: true }) // Add this line

    const payload = {
      message: 'qr',
      qrCode: qr
    }
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  })

  client.on('loading_screen', (percent, message) => {
    console.log(message);
    //--------------------------
    const payload = {
      message: 'scanned'
    }
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
    //---------------------------
  })

  client.on('ready', () => {
    const payload = {
      message: 'ready'
    }
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  })


  client.on('authenticated', (session) => {
    const payload = {
      message: 'authenticated'
    }
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
    console.log('AUTHENTICATED', session)
  })

  client.on('auth_failure', (msg) => {
    // Fired if session restore was unsuccessful
    console.error('AUTHENTICATION FAILURE', msg)
  })

  // If client closes connection, stop sending events
  res.on('close', () => {
    console.log('client dropped me');
    // clearTimeout(timeoutId);
    res.end();
  });
});

// client.on('message', async (msg) => {
//   console.log('MESSAGE RECEIVED', msg)

//   if (msg.body === '!ping reply') {
//     // Send a new message as a reply to the current one
//     msg.reply('pong')
//   } else if (msg.body === 'ping') {
//     // Send a new message to the same chat
//     client.sendMessage(msg.from, 'pong')
//   }
// })

// Listening for the server
const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`🚀 @ http://localhost:${PORT}`))

////////////////////////////////////////////////////////////////////////////////////////////

// curl -i -X POST https://graph.facebook.com/v13.0/<YOUR PHONE NUMBER ID>/messages -H 'Authorization: Bearer <YOUR ACCESS TOKEN>' -H 'Content-Type: application/json' -d '{ "messaging_product": "whatsapp", "to": "<PHONE NUMBER TO MESSAGE>", "type": "template", "template": { "name": "hello_world", \"language\": { \"code\": \"en_US\" } } }'
