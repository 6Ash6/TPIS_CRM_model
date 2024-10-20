const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

// Путь к базе данных
const dbFilePath = './database.db';

afterEach((done) => {
  const db = new sqlite3.Database(dbFilePath, (err) => {
    if (err) {
      console.error('Ошибка подключения к базе данных:', err);
      return done(err);
    }

    db.run('DELETE FROM clients', [], (err) => {
      if (err) {
        console.error('Ошибка очистки таблицы clients:', err);
        return done(err);
      }
      db.close(done); // Закрываем базу данных после очистки
    });
  });
});


test('should insert a new client into the database', (done) => {
  // Подключаемся к базе данных
  const db = new sqlite3.Database(dbFilePath, (err) => {
    if (err) {
      console.error('Ошибка подключения к базе данных:', err);
    }

    // Вставляем данные в таблицу clients
    const insertQuery = `INSERT INTO clients (name, surname, lastName, contacts) VALUES (?, ?, ?, ?)`;
    const clientData = ['John', 'Doe', 'Smith', 'john@example.com'];

    db.run(insertQuery, clientData, function(err) {
      if (err) {
        console.error('Ошибка вставки клиента:', err);
        return done(err);
      }

      // Проверяем, что клиент был добавлен
      expect(this.lastID).toBeGreaterThan(0);

      // Закрываем базу данных
      db.close((err) => {
        if (err) {
          console.error('Ошибка закрытия базы данных:', err);
        }
        done();
      });
    });
  });
});

test('should read clients from the database', (done) => {
  // Подключаемся к базе данных
  const db = new sqlite3.Database(dbFilePath, (err) => {
    if (err) {
      console.error('Ошибка подключения к базе данных:', err);
    }

    // Вставляем тестовые данные
    const insertQuery = `INSERT INTO clients (name, surname, lastName, contacts) VALUES (?, ?, ?, ?)`;
    const clientData = ['Jane', 'Doe', 'Brown', 'jane@example.com'];

    db.run(insertQuery, clientData, function(err) {
      if (err) {
        console.error('Ошибка вставки клиента:', err);
        return done(err);
      }

      // Читаем данные из таблицы clients
      db.all('SELECT * FROM clients', [], (err, rows) => {
        if (err) {
          console.error('Ошибка чтения из базы данных:', err);
          return done(err);
        }

        // Проверяем, что данные были добавлены и прочитаны
        expect(rows.length).toBeGreaterThan(0);
        expect(rows[0].name).toBe('Jane');

        // Закрываем базу данных
        db.close((err) => {
          if (err) {
            console.error('Ошибка закрытия базы данных:', err);
          }
          done();
        });
      });
    });
  });
});

test('should delete all clients from the database', (done) => {
  // Подключаемся к базе данных
  const db = new sqlite3.Database(dbFilePath, (err) => {
    if (err) {
      console.error('Ошибка подключения к базе данных:', err);
    }

    // Удаляем все записи из таблицы clients
    db.run('DELETE FROM clients;', (err) => {
      if (err) {
        console.error('Ошибка удаления клиентов:', err);
        return done(err);
      }

      // Проверяем, что записи были удалены
      db.all('SELECT * FROM clients', [], (err, rows) => {
        if (err) {
          console.error('Ошибка чтения из базы данных:', err);
          return done(err);
        }

        expect(rows.length).toBe(0);

        // Закрываем базу данных
        db.close((err) => {
          if (err) {
            console.error('Ошибка закрытия базы данных:', err);
          }
          done();
        });
      });
    });
  });
});
