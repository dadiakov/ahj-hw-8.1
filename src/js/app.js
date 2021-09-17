/* eslint-disable linebreak-style */
/* eslint-disable no-prototype-builtins */
/* eslint-disable max-len */
/* eslint-disable no-use-before-define */
/* eslint-disable consistent-return */
/* eslint-disable no-alert */
/* eslint-disable no-multi-assign */
/* eslint-disable no-shadow */
/* eslint-disable no-console */
/* eslint-disable no-unused-vars */
/* eslint-disable no-param-reassign */
/* eslint-disable class-methods-use-this */

let nicName = '';
const { v4: uuidv4 } = require('uuid');

const users = new Map();

class Chat {
  constructor(element) {
    if (typeof element === 'string') {
      element = document.querySelector(element);
    }
    this.element = element;
    this.userID = null;
    this.nicName = null;

    this.chatForm = document.querySelector('.chat-form');
    this.registerForm = document.querySelector('.create-user');

    this.users = [];

    this.chatForm.addEventListener('submit', this.sendMessage);
    this.registerForm.addEventListener('submit', this.createUser);
    document.querySelector('.input-nic-name').addEventListener('input', () => {
      document.querySelector('.existed-user').classList.add('hide');
    });
  }

  createUser(e) {
    e.preventDefault();
    this.nicName = document.querySelector('.input-nic-name').value;
    nicName = this.nicName;

    ws.send(JSON.stringify({ checkUser: this.nicName, userID: chat.userID }));

    document.querySelector('.input-nic-name').value = '';
  }

  sendMessage(e) {
    e.preventDefault();
    const { value } = document.querySelector('.chat-input');
    const time = getCurrentTime();
    const data = {
      userID: chat.userID, nicName, text: value, time,
    };
    ws.send(JSON.stringify(data));
    document.querySelector('.chat-input').value = '';
  }

  createUserOnBoard(name) {
    const div = document.createElement('div');
    div.textContent = name;
    div.classList.add('.my-nic');
    document.querySelector('.users').appendChild(div);
  }

  renderMessage(message) {
    const outerDiv = document.createElement('div');
    const nicNameDiv = document.createElement('div');
    const textDiv = document.createElement('div');
    nicNameDiv.textContent = `${message.nicName} ${message.time}`;
    nicNameDiv.classList.add('message-nic');
    textDiv.textContent = message.text;
    outerDiv.classList.add('message-item');
    if (message.nicName === nicName) {
      nicNameDiv.classList.add('my-nic');
      outerDiv.classList.add('my-message-container');
    }
    outerDiv.appendChild(nicNameDiv);
    outerDiv.appendChild(textDiv);
    document.querySelector('.chat-content').appendChild(outerDiv);
    outerDiv.scrollIntoView(false);
  }

  renderNicNames(message) {
    const nicNameDiv = document.createElement('div');
    nicNameDiv.textContent = message;
    nicNameDiv.classList.add('nic-list-item');
    if (message === nicName) {
      nicNameDiv.classList.add('my-nic');
    }
    document.querySelector('.users').appendChild(nicNameDiv);
    document.querySelector('.users').scrollIntoView(false);
  }

  renderAllData() {
    ws.send('allData');
  }
}

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

const chat = new Chat('.container');
chat.userID = uuidv4();

const ws = new WebSocket('wss://dadiakov-ahj-hw81.herokuapp.com//wss');

ws.addEventListener('open', () => {
  console.log('connected');
  chat.renderAllData();
});

ws.addEventListener('message', (evt) => {
  const { data } = evt;

  const subData = JSON.parse(data);

  if (subData.hasOwnProperty('subject')) {
    document.querySelector('.users').innerHTML = '';
    subData.userList.forEach((e) => {
      chat.renderNicNames(e[1]);
    });
    return;
  }

  if (subData.hasOwnProperty('hasUser')) {
    if (subData.hasUser === 'exist') {
      document.querySelector('.existed-user').classList.remove('hide');
      return;
    }
    document.querySelector('.create-user').classList.add('hide');
    document.querySelector('.input-chat-text').classList.remove('hide');
    return;
  }
  // Одиночные сообщения
  if (subData.message && (typeof subData.message !== 'object')) {
    const subDataMessage = JSON.parse(subData.message);
    chat.renderMessage(subDataMessage);
    return;
  }

  // Первичная загрузка + регистрация
  if (subData.message) {
    chat.renderNicNames(new Map(subData.arrayMap).get(chat.userID));
    subData.message.forEach((e) => {
      chat.renderMessage(e);
    });
    document.querySelector('.users').innerHTML = '';
    subData.userList.forEach((e) => {
      chat.renderNicNames(e[1]);
    });
  }
});

ws.addEventListener('close', (evt) => {
  console.log('connection closed', evt);
});

ws.addEventListener('error', () => {
  console.log('error');
});
