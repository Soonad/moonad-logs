var express = require("express");
var app = express();
var fs = require("fs").promises;
var path = require("path");
var db = require("./db.js");

// Formats & Validation
// ====================

function hex(bits, hex) {
  if (!/^[a-fA-F0-9]*$/.test(hex)) {
    throw "Invalid hex.";
  };
  while (hex.length * 4 < bits) {
    hex = "0" + hex;
  };
  if (hex.length * 4 > bits) {
    hex = hex.slice(0, Math.floor(bits / 4));
  }
  return hex;
};

function num(val) {
  var num = parseInt(val, 10);
  if (isNaN(num)) {
    throw "Invalid num.";
  }
  return num;
};

// Posts: saving and loading
// =========================

// post |         bit | char, 4bits | byte, 8bits | 
// ---- | ----------- | ----------- | ----------- |
//    0 |    0 a  255 |    0 a   63 |    0 a   32 |
//    1 |  256 a  511 |   64 a  127 |   32 a   63 |
//    2 |  512 a  767 |  128 a  191 |   64 a   95 |
//    3 |  768 a 1023 |  192 a  256 |   96 a  127 |

async function topic_size(topic) {
  return (await db.size(hex(64, topic))) / 32;
};

async function push_post(topic, post) {
  return await db.push(hex(64, topic), hex(256, post));
};

async function read_post(topic, num) {
  return await db.read(hex(64, topic), (num * 256) / 8, ((num + 1) * 256) / 8 - 1);
};

// HTTP API
// ========

app.use(express.json());

app.get("/size", async (req, res) => {
  try {
    var size = await topic_size(hex(64, req.query.topic));
    res.send(String(size));
  } catch (e) {
    res.send("fail");
  };
});

app.get("/read", async (req, res) => {
  try {
    var topic = hex(64, req.query.topic);
    var from = req.query.from ? num(req.query.from) : 0;
    var to = req.query.to ? num(req.query.to) : (await topic_size(topic)) - 1;
    var reads = [];
    for (var i = from; i <= to; ++i) {
      reads.push(read_post(topic, i));
    };
    var blocks = await Promise.all(reads);
    var html = "";
    html += blocks.join(";");
    res.send(html);
  } catch (e) {
    res.send("fail");
  }
});

app.get("/post", async (req, res) => {
  try {
    var topic = hex(64, req.query.topic);
    var author = hex(64, req.query.author);
    var message = hex(128, req.query.message);
    var time = hex(64, Date.now().toString(16));
    console.log("New post:");
    console.log("- topic    = " + topic);
    console.log("- author   = " + author);
    console.log("- message  = " + message);
    console.log("- time     = " + time);
    db.push(topic, time + author + message);
    res.send("done");
  } catch (e) {
    res.send("fail");
  };
});

console.log("Server open!");
app.listen(80);

/*
hash("FormalityBlog :: 0 :: New JS Compiler") - 0x01237777abcd1234
chat.moonad.org/0x01237777abcd1234

hash("TaelinArena :: game :: 0") - 0x12345678abcd0000
chat.moonad.org/0x12345678abcd0000

Tópico
- ID       : 64 bits
- Messages : List(Message)

Mensagem : 256 bits
- Timestamp : 64 bits
- Sender    : 64 bits
- Message   : 128 bits

API
- size(topic)
- read(topic, from, to)
- post(topic, auth, message)
- watch(topic)

post("0x0123456789abcdef", "0x0123456789abcdef0123456789abcdef");
*/
