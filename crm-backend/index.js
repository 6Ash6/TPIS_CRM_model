const { createServer } = require('http');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

/**
 * Путь к базе данных SQLite.
 * @constant {string}
 */
const dbPath = path.resolve(process.cwd(), './database.db');
const db = new sqlite3.Database(dbPath);

/**
 * Создаёт таблицу клиентов в базе данных, если она не существует.
 * @function
 */
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

/**
 * Номер порта, на котором будет запущен сервер.
 * @constant {number}
 */
const PORT = process.env.PORT || 3000;

/**
 * Префикс URI для всех методов API.
 * @constant {string}
 */
const URI_PREFIX = '/api/clients';

/**
 * Класс ошибки API, используемый для отправки ответа с кодом ошибки и описанием.
 * @class
 * @extends Error
 * @param {number} statusCode - Код статуса ошибки.
 * @param {Object} data - Данные об ошибке.
 */
class ApiError extends Error {
  constructor(statusCode, data) {
    super();
    this.statusCode = statusCode;
    this.data = data;
  }
}

/**
 * Асинхронно считывает тело запроса и разбирает его как JSON.
 * @async
 * @function drainJson
 * @param {Object} req - Объект HTTP запроса.
 * @returns {Promise<Object>} Объект, созданный из тела запроса.
 * @throws {ApiError} Некорректные данные в аргументе.
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
 * Проверяет и преобразует данные в объект клиента.
 * @function makeClientFromData
 * @param {Object} data - Входные данные клиента.
 * @returns {Object} Объект клиента.
 * @throws {ApiError} Некорректные данные (код 422).
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
 * Получает список клиентов из базы данных.
 * @function getClientList
 * @param {Object} [params] - Параметры запроса.
 * @returns {Promise<Array<Object>>} Массив объектов клиентов.
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
 * Создаёт нового клиента и сохраняет его в базе данных.
 * @function createClient
 * @param {Object} data - Данные клиента из тела запроса.
 * @returns {Promise<Object>} Объект клиента.
 * @throws {ApiError} Некорректные данные (код 422).
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
 * Получает клиента по ID из базы данных.
 * @function getClient
 * @param {string} itemId - Идентификатор клиента.
 * @returns {Promise<Object>} Объект клиента.
 * @throws {ApiError} Клиент не найден (код 404).
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
 * Обновляет данные клиента по его ID и сохраняет изменения.
 * @function updateClient
 * @param {string} itemId - Идентификатор клиента.
 * @param {Object} data - Обновлённые данные клиента.
 * @returns {Promise<Object>} Обновлённый объект клиента.
 * @throws {ApiError} Клиент не найден (код 404).
 * @throws {ApiError} Некорректные данные (код 422).
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
 * Удаляет клиента по его ID из базы данных.
 * @function deleteClient
 * @param {string} itemId - Идентификатор клиента.
 * @returns {Promise<Object>} Пустой объект.
 * @throws {ApiError} Клиент не найден (код 404).
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

/**
 * HTTP сервер для обработки API-запросов к базе данных клиентов.
 * @event
 * @param {Object} req - Объект запроса.
 * @param {Object} res - Объект ответа.
 */
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

/**
 * Слушает событие 'listening' и выводит сообщение о запуске сервера.
 * @event
 */
  .on('listening', () => {
    if (process.env.NODE_ENV !== 'test') {
      console.log(`Сервер CRM запущен. Вы можете использовать его по адресу http://localhost:${PORT}`);
    }
  })
  .listen(PORT);

/**
 * Закрывает подключение к базе данных при завершении процесса.
 * @event
 */
process.on('exit', () => {
  db.close();
});
