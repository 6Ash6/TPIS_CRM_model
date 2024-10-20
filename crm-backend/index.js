/* eslint-disable no-console */
// импорт стандартных библиотек Node.js
const { createServer } = require('http');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Указываем путь к базе данных SQLite
const dbPath = path.resolve(process.cwd(), './database.db');
const db = new sqlite3.Database(dbPath);

// Создание таблицы, если она не существует
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      surname TEXT NOT NULL,
      lastName TEXT,
      contacts TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error("Ошибка при создании таблицы:", err);
    }
  });
});

// номер порта, на котором будет запущен сервер
const PORT = process.env.PORT || 3000;
// префикс URI для всех методов приложения
const URI_PREFIX = '/api/clients';

/**
 * Класс ошибки, используется для отправки ответа с определённым кодом и описанием ошибки
 */
class ApiError extends Error {
  constructor(statusCode, data) {
    super();
    this.statusCode = statusCode;
    this.data = data;
  }
}

/**
 * Асинхронно считывает тело запроса и разбирает его как JSON
 * @param {Object} req - Объект HTTP запроса
 * @throws {ApiError} Некорректные данные в аргументе
 * @returns {Object} Объект, созданный из тела запроса
 */
function drainJson(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      resolve(JSON.parse(data));
    });
  });
}

/**
 * Проверяет входные данные и создаёт из них корректный объект клиента
 * @param {Object} data - Объект с входными данными
 * @throws {ApiError} Некорректные данные в аргументе (statusCode 422)
 * @returns {{ name: string, surname: string, lastName: string, contacts: object[] }} Объект клиента
 */
function makeClientFromData(data) {
  const errors = [];

  function asString(v) {
    return v && String(v).trim() || '';
  }

  const client = {
    name: asString(data.name),
    surname: asString(data.surname),
    lastName: asString(data.lastName),
    contacts: Array.isArray(data.contacts) ? data.contacts.map(contact => ({
      type: asString(contact.type),
      value: asString(contact.value),
    })) : [],
  };

  if (!client.name) errors.push({ field: 'name', message: 'Не указано имя' });
  if (!client.surname) errors.push({ field: 'surname', message: 'Не указана фамилия' });
  if (client.contacts.some(contact => !contact.type || !contact.value))
    errors.push({ field: 'contacts', message: 'Не все добавленные контакты полностью заполнены' });

  if (errors.length) throw new ApiError(422, { errors });

  return client;
}

/**
 * Возвращает список клиентов из базы данных SQLite
 * @param {{ search: string }} [params] - Поисковая строка
 * @returns {Promise<{}[]>} Массив клиентов
 */
function getClientList(params = {}) {
  return new Promise((resolve, reject) => {
    const query = params.search
      ? 'SELECT * FROM clients WHERE name LIKE ? OR surname LIKE ? OR lastName LIKE ?'
      : 'SELECT * FROM clients';
    const values = params.search ? [`%${params.search}%`, `%${params.search}%`, `%${params.search}%`] : [];
    db.all(query, values, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

/**
 * Создаёт и сохраняет клиента в базу данных SQLite
 * @throws {ApiError} Некорректные данные в аргументе, клиент не создан (statusCode 422)
 * @param {Object} data - Данные из тела запроса
 * @returns {Promise<{}>} Объект клиента
 */
function createClient(data) {
  return new Promise((resolve, reject) => {
    const { name, surname, lastName, contacts } = makeClientFromData(data);
    const query = `
      INSERT INTO clients (name, surname, lastName, contacts, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`;
    const values = [name, surname, lastName, JSON.stringify(contacts)];
    db.run(query, values, function (err) {
      if (err) return reject(err);
      resolve({
        id: this.lastID,
        name, surname, lastName, contacts,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });
  });
}

/**
 * Возвращает объект клиента по его ID из базы данных SQLite
 * @param {string} itemId - ID клиента
 * @throws {ApiError} Клиент с таким ID не найден (statusCode 404)
 * @returns {Promise<{}>} Объект клиента
 */
function getClient(itemId) {
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM clients WHERE id = ?';
    db.get(query, [itemId], (err, row) => {
      if (err) return reject(err);
      if (!row) return reject(new ApiError(404, { message: 'Client Not Found' }));
      resolve(row);
    });
  });
}

/**
 * Изменяет клиента с указанным ID и сохраняет изменения в базу данных SQLite
 * @param {string} itemId - ID изменяемого клиента
 * @param {Object} data - Объект с изменяемыми данными
 * @throws {ApiError} Клиент с таким ID не найден (statusCode 404)
 * @throws {ApiError} Некорректные данные в аргументе (statusCode 422)
 * @returns {Promise<{}>} Объект клиента
 */
function updateClient(itemId, data) {
  return new Promise((resolve, reject) => {
    const { name, surname, lastName, contacts } = makeClientFromData(data);
    const query = `
      UPDATE clients
      SET name = ?, surname = ?, lastName = ?, contacts = ?, updatedAt = datetime('now')
      WHERE id = ?`;
    const values = [name, surname, lastName, JSON.stringify(contacts), itemId];
    db.run(query, values, function (err) {
      if (err) return reject(err);
      if (this.changes === 0) return reject(new ApiError(404, { message: 'Client Not Found' }));
      resolve({ id: itemId, name, surname, lastName, contacts, updatedAt: new Date().toISOString() });
    });
  });
}

/**
 * Удаляет клиента из базы данных SQLite
 * @param {string} itemId - ID клиента
 * @throws {ApiError} Клиент с таким ID не найден (statusCode 404)
 * @returns {Promise<{}>} Пустой объект
 */
function deleteClient(itemId) {
  return new Promise((resolve, reject) => {
    const query = 'DELETE FROM clients WHERE id = ?';
    db.run(query, [itemId], function (err) {
      if (err) return reject(err);
      if (this.changes === 0) return reject(new ApiError(404, { message: 'Client Not Found' }));
      resolve({});
    });
  });
}

// создаём HTTP сервер
module.exports = createServer(async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.end();
    return;
  }

  if (!req.url || !req.url.startsWith(URI_PREFIX)) {
    res.statusCode = 404;
    res.end(JSON.stringify({ message: 'Not Found' }));
    return;
  }

  const [uri, query] = req.url.substr(URI_PREFIX.length).split('?');
  const queryParams = {};

  if (query) {
    for (const piece of query.split('&')) {
      const [key, value] = piece.split('=');
      queryParams[key] = value ? decodeURIComponent(value) : '';
    }
  }

  try {
    const body = await (async () => {
      if (uri === '' || uri === '/') {
        if (req.method === 'GET') return getClientList(queryParams);
        if (req.method === 'POST') {
          const createdItem = await createClient(await drainJson(req));
          res.statusCode = 201;
          res.setHeader('Access-Control-Expose-Headers', 'Location');
          res.setHeader('Location', `${URI_PREFIX}/${createdItem.id}`);
          return createdItem;
        }
      } else {
        const itemId = uri.substr(1);
        if (req.method === 'GET') return getClient(itemId);
        if (req.method === 'PATCH') return updateClient(itemId, await drainJson(req));
        if (req.method === 'DELETE') return deleteClient(itemId);
      }
      return null;
    })();
    res.end(JSON.stringify(body));
  } catch (err) {
    if (err instanceof ApiError) {
      res.writeHead(err.statusCode);
      res.end(JSON.stringify(err.data));
    } else {
      res.statusCode = 500;
      res.end(JSON.stringify({ message: 'Server Error' }));
      console.error(err);
    }
  }
})
  .on('listening', () => {
    if (process.env.NODE_ENV !== 'test') {
      console.log(`Сервер CRM запущен. Вы можете использовать его по адресу http://localhost:${PORT}`);
    }
  })
  .listen(PORT);

// Закрытие соединения с базой данных при выходе
process.on('exit', () => {
  db.close();
});
