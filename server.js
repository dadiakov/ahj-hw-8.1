/* eslint-disable linebreak-style */
const http = require('http');
const Koa = require('koa');
const cors = require('@koa/cors');
const koaBody = require('koa-body');
const WS = require('ws');


const app = new Koa();
app.use(cors());

app.use(koaBody({
  urlencoded: true,
  multipart: true,
  json: true,
}));

const port = process.env.PORT || 7070;
const server = http.createServer(app.callback());
const wsServer = new WS.Server({ server });

const messages = [{ userID: 1, nicName: 'Dima', text: 'Some text', time : getCurrentTime() }];
const users = new Map();

users.set('1', 'Dima');

wsServer.on('connection', (ws) => {
  let id = 0;
  const errCallback = (e) => { console.log(e); };


  ws.on('message', (e) => {

    if (e === 'allData') {
      let arrayMap = Array.from(users.entries());

      ws.send(JSON.stringify({ message: messages , userList : arrayMap}), errCallback);
      return;
    }

    if (JSON.parse(e).hasOwnProperty('checkUser')) {
     const user = (JSON.parse(e)).checkUser;
     const userID = (JSON.parse(e)).userID;
      if (messages.some(e => e.nicName === user)) {
        ws.send(JSON.stringify({ hasUser: 'exist'}));
      } else {
        messages.push({ userID, nicName : user, text : `${user} присоединился к чату `, time : getCurrentTime()});
        users.set(userID, user);
        id = userID;

        ws.send(JSON.stringify({ hasUser: 'not-exist'}));

        let arrayMap = Array.from(users.entries());           

        Array.from(wsServer.clients)
        .filter(client => client.readyState === WS.OPEN)
        .forEach(client => client.send(JSON.stringify({ message: [{ userID, nicName : user, text : `${user} присоединился к чату`, time : getCurrentTime()}], userList : arrayMap}), errCallback));

      }
      return;
    }

    messages.push(JSON.parse(e));

    let arrayMap = Array.from(users.entries());

    Array.from(wsServer.clients)
      .filter(client => client.readyState === WS.OPEN)
      .forEach(client => client.send(JSON.stringify({ message : e , userList : arrayMap}), errCallback));

  });
  ws.on('close', e => {
    users.delete(id);
    let arrayMap = Array.from(users.entries());
    Array.from(wsServer.clients)
    .filter(client => client.readyState === WS.OPEN)
    .forEach(client => client.send(JSON.stringify({subject : 'Пользователь ушел', userList : arrayMap})));
  })
  
});

server.listen(port);

function getCurrentTime() {
  const now = new Date();
  const year = now.getFullYear();
  let month = now.getMonth() + 1;
  if (month < 10) month = `${0}${month}`;
  const day = now.getDate();
  let hour = now.getHours();
  if (hour < 10) hour = `${0}${hour}`;
  let minutes = now.getMinutes();
  if (minutes < 10) minutes = `${0}${minutes}`;
  return `${day}.${month}.${year} ${hour}:${minutes}`;
}