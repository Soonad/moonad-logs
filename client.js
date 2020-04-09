var req = require("xhr-request-promise");
var url = "http://localhost";

async function size(topic) {
  var got = await req(url+"/size?topic="+topic);
  if (got === "fail") {
    throw "fail";
  } else {
    return Number(got);
  };
};

async function read(topic, from, to) {
  var topic_param = "topic="+topic;
  var from_param = from ? "&from="+from : "";
  var to_param = to ? "&to="+to : "";
  var got = await req(url+"/read?"+topic_param+from_param+to_param);
  if (got === "fail") {
    throw "fail";
  } else {
    if (got.length === 0) {
      return [];
    } else {
      var blocks = got.split(";");
      var posts = [];
      for (var i = 0; i < blocks.length; ++i) {
        var time = blocks[i].slice(0, 16);
        var author = blocks[i].slice(16, 32);
        var message = blocks[i].slice(32, 64);
        posts.push({time, author, message});
      };
      return posts;
    };
  }
};

async function post(topic, author, message) {
  var topic_param = "topic="+topic;
  var author_param = "&author="+author;
  var message_param = "&message="+message;
  var got = await req(url+"/post?"+topic_param+author_param+message_param);
  if (got === "fail") {
    throw "fail";
  } else {
    return true;
  };
};

async function watch(topic, callback, delay = 1000) {
  var size = 0;
  setInterval(async () => {
    var new_posts = await read(topic, size);
    size += new_posts.length;
    if (new_posts.length > 0) {
      callback(new_posts);
    };
  }, delay);
};

module.exports = {size, read, post, watch};

//(async () => {
  ////console.log("read: " + JSON.stringify(await read("0", 30), null, 2));
  ////console.log("size: " + await size("0"));
  ////watch("0", (new_posts) => {
    ////console.log(":: "+new_posts.length+" new_posts:");
    ////console.log(JSON.stringify(new_posts, null, 2));
  ////});
  ////console.log("post: " + await post("0", "4444", "9999"));
//})();
