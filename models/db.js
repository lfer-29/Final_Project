const Datastore = require('nedb-promises');
const path = require('path');

const usersDb = Datastore.create({
    filename: path.join(__dirname, '../data/users.db'),
    autoload: true
});

const sheetsDb = Datastore.create({
    filename: path.join(__dirname, '../data/sheets.db'),
    autoload: true
});

const expensesDb = Datastore.create({
    filename: path.join(__dirname, '../data/expenses.db'),
    autoload: true
});

// Ensure unique index for usernames
usersDb.ensureIndex({ fieldName: 'username', unique: true });

module.exports = {
    usersDb,
    sheetsDb,
    expensesDb
};
