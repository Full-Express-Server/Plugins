/**
 * **The Name of the plugin**
 * @type { String }
 */
const name = `database`;

/**
 * **The Author of the plugin**
 * @type { String }
 */
const author = `FES`;

/**
 * **The Description of the plugin**
 * @type { String }
 */
const description = `The official database plugin that provides a simple DB for FES.`;

/**
 * **Whether the plugin is enabled or not**
 * @type { Boolean }
 */
const enabled = true;

/**
 * **The Version of the plugin**
 * @type { Number }
 */
const version = 1;

/**
 * **The dependencies of the plugin**
 * @type { Array }
 */
const dependencies = [
    `Flagen.uuid`
];


/**
 * **The Plugin Permission**
 * @type { Array }
 */
const permissions = [
    "*",
    "FES.database",
    "FES.database.*",
    "FES.database.create",
    "FES.database.create.*",
    "FES.database.create.table",
    "FES.database.create.table.*",
    "FES.database.create.table.column",
    "FES.database.create.row",
    "FES.database.create.row.*",
    "FES.database.create.column",
    "FES.database.create.column.*",
    "FES.database.create.column.all",
    "FES.database.create.column.all.force",
    "FES.database.update",
    "FES.database.update.*",
    "FES.database.update.table",
    "FES.database.update.table.*",
    "FES.database.update.table.name",
    "FES.database.update.table.column",
    "FES.database.update.table.column.*",
    "FES.database.update.table.column.name",
    "FES.database.update.table.column.value",
    "FES.database.update.column",
    "FES.database.update.column.*",
    "FES.database.update.column.all",
    "FES.database.update.column.all.force",
    "FES.database.delete",
    "FES.database.delete.*",
    "FES.database.delete.table",
    "FES.database.delete.table.*",
    "FES.database.delete.table.column",
    "FES.database.delete.table.column.*",
    "FES.database.delete.table.column.name",
    "FES.database.delete.table.column.value",
    "FES.database.read",
    "FES.database.read.*",
    "FES.database.read.table",
    "FES.database.read.table.*",
    "FES.database.read.table.all",
    "FES.database.read.row",
    "FES.database.read.row.*",
    "FES.database.read.row.all",
];

const fs = require('fs');
const { join } = require('path');
let objectsChanged = 0;

/**
 * ### run(exposed, payload);
 * 
 * Used to call the main function of the plugin
 * @param { Object? } exposed Anything that you want the plugin to have access to.
 * @param { Object? } payload Any information that you want the plugin to work with.
 * 
 * example:
 * ```js
 * let plugin = require(`./plugins/FES.example`);
 * plugin.run({ fs }, { saveThis: "ok" })
 *     .then(returned => { console.log(returned)})
 *     .catch(error => { console.error(error)});
 * ```
 * 
 * @returns { Promise }
 */
async function run(exposed, payload) {
    if (payload?.firstStart) {
        if (!fs.existsSync(join(__dirname, `FES.database`))) {
            fs.mkdirSync(join(__dirname, `FES.database`));
            const UUID = await exposed.callPlugin(`Flagen.uuid`);
            fs.writeFileSync(join(__dirname, `FES.database/users.json`), JSON.stringify({ 
                [UUID]: { 
                    id: UUID, 
                    username: "root", 
                    oauth: await exposed.callPlugin(`Flagen.uuid`), 
                    notes: "This is the root user.", 
                    permissions: permissions
                } 
            }, null, 4));
        }
        exposed.log(`Loaded FES.database`, { type: `success` });
        return;
    }

    if (!payload?.userID) throw { status: 400, message: `(userID) is required` };
    if (!payload?.oauth) throw { status: 400, message: `(oauth) token is required` };
    if (!payload?.command) throw { status: 400, message: `(command) is required` };

    const command = payload.command.split(/ +/)[0].toLowerCase();
    const args = payload.command.split(/ +/).slice(1).map(arg => arg.toLowerCase());
    const commands = ["create", "update", "delete",];
    if (!commands.includes(command)) throw { status: 400, message: `Invalid command` };

    const users = JSON.parse(fs.readFileSync(join(__dirname, `src/plugins/FES.database/users.json`)), `utf-8`);
    if (!users[payload.userID]) throw { status: 404, message: `User not found` };
    if (users[payload.userID].oauth !== payload.oauth) throw { status: 403, message: `Invalid OAuth token` };

    switch (command) {
        case `create`: return await Create(args, payload, users, exposed);
        case `create`: return await Read(args, payload, users, exposed);
        case `update`: return await Update(args, payload, users, exposed);
        case `delete`: return await Delete(args, payload, users, exposed);
        default: throw { status: 400, message: `Invalid command, the available commands are: create, update, delete` };
    }

}

async function Create(args, payload, users, exposed) {
    if (!checkPerms(`FES.database.create`, users, payload)) throw { status: 403, message: `You do not have permission to create database entries` };
    const subCommands = [`table`, `row`, `column`];
    if (!subCommands.includes(args[0])) throw { status: 400, message: `Invalid arguments, The available args are: ${subCommands.join(", ")}` };
    if (args[0] === `table`) {
        if (!checkPerms(`FES.database.create.*`, users, payload) || !checkPerms(`FES.database.create.table`, users, payload)) throw { status: 403, message: `You do not have permission to create tables` };
        if (!args[1]) throw { status: 400, message: `Table name is required` };
        if (args[1].toLowerCase() === `all`) throw { status: 400, message: `Invalid Name: A table cannot be named all due to command rules` };
        if (fs.existsSync(join(__dirname, `src/plugins/FES.database/${args[1]}.json`))) throw { status: 400, message: `Table already exists` };
        if (!payload?.entry) throw { status: 400, message: `the entry value is missing, if you wish not to pass any data please set it as a empty object` };
        fs.writeFileSync(join(__dirname, `src/plugins/FES.database/${args[1]}.json`), JSON.stringify({ [await exposed.callPlugin(`Flagen.uuid`)]: payload.entry }, null, 4));
        return `Table created: ${args[1]}`;
    } else if (args[0] === `row`) {
        if (!checkPerms(`FES.database.create.*`, users, payload) || !checkPerms(`FES.database.create.row`, users, payload)) throw { status: 403, message: `You do not have permission to create rows` };
        if (!args[1]) throw { status: 400, message: `Table name is required` };
        if (!fs.existsSync(join(__dirname, `src/plugins/FES.database/${args[1]}.json`))) throw { status: 404, message: `Table does not exist` };
        let table = JSON.parse(fs.readFileSync(join(__dirname, `src/plugins/FES.database/${args[1]}.json`), `utf-8`));        
        let UUID; do { UUID = await exposed.callPlugin("Flagen.uuid"); } while (table[UUID]);
        table[UUID] = payload.entry;
        fs.writeFileSync(join(__dirname, `src/plugins/FES.database/${args[1]}.json`), JSON.stringify(table, null, 4));
        return `Row created`;
    } else if (args[0] === `column`) {
        if (!checkPerms(`FES.database.create.*`, users, payload) || !checkPerms(`FES.database.create.column`, users, payload) || !checkPerms(`FES.database.create.column.*`, users, payload)) throw { status: 403, message: `You do not have permission to create columns` };
        if (!args[1]) throw { status: 400, message: `Table name is required` };
        if (!fs.existsSync(join(__dirname, `src/plugins/FES.database/${args[1]}.json`))) throw { status: 404, message: `Table does not exist` };
        let table = JSON.parse(fs.readFileSync(join(__dirname, `src/plugins/FES.database/${args[1]}.json`), `utf-8`)); 

        if (args[2] === `all`) {
            if (!checkPerms(`FES.database.create.column.*`, users, payload) || !checkPerms(`FES.database.create.column.all`, users, payload)) throw { status: 403, message: `You do not have permission to create columns in all rows` };
            if (!payload?.entry?.fields) throw { status: 400, message: `Missing (fields) inside of (entry)`};
            if (args[3] === `--force`) {
                if (!checkPerms(`FES.database.create.column.*`, users, payload) || !checkPerms(`FES.database.create.column.all.force`, users, payload)) throw { status: 403, message: `You do not have permission to force change columns for all rows` };
                Object.entries(table).forEach(([id, item]) => { objectsChanged = objectsChanged + addFields(table, id, payload.entry.fields, { overwrite: true }); });
            } else if (typeof args[3] != `undefined` && args[3] != `--force`) throw { status: 400, message: `Invalid arguments, The available args are: all [--force]` };
            Object.entries(table).forEach(([id, item]) => {  objectsChanged = objectsChanged + addFields(table, id, payload.entry.fields, { overwrite: false }); });
            if (objectsChanged === 0) return { status: 200, message: `No new fields were added to any rows in the table` };
            fs.writeFileSync(join(__dirname, `src/plugins/FES.database/${args[1]}.json`), JSON.stringify(table, null, 4));
            return `Field${objectsChanged > 1 ? `s` : ``}${args[3] === `--force` ? ` forcefully` : ``} created in ${objectsChanged} row${objectsChanged > 1 ? `s` : ``}`;
 
        } else if (args[2] != `all` && typeof args[2] != `undefined`) throw { status: 400, message: `Invalid arguments, The available args are: all [--force]` }; 
        else {
            if (!payload?.entry?.id) throw { status: 400, message: `Missing (id): You need to provide a Row ID in the (entry) key`};
            addFields(table, payload.entry.id, payload.entry.fields, { overwrite: false});
            fs.writeFileSync(join(__dirname, `src/plugins/FES.database/${args[1]}.json`), JSON.stringify(table, null, 4));
            return `Field created in row: ${args[1]}`;
        }
    } else throw { status: 400, message: `Invalid arguments, The available args are: table, row, column` };

}

async function Update(args, payload, users, exposed) {
    if (!checkPerms(`FES.database.update`, users, payload)) throw { status: 403, message: `You do not have permission to update database entries` };
    const subCommands = [`table`, `column`];
    if (!subCommands.includes(args[0])) throw { status: 400, message: `Invalid arguments, The available args are: ${subCommands.join(", ")}` };
    if (args[0] === `table`) {
        if (!checkPerms(`FES.database.update.*`, users, payload) || !checkPerms(`FES.database.update.table`, users, payload)) throw { status: 403, message: `You do not have permission to update tables` };
        if (!args[1]) throw { status: 400, message: `Table name is required` };
        if (!fs.existsSync(join(__dirname, `src/plugins/FES.database/${args[1]}.json`))) throw { status: 400, message: `Table does not exist` };
        let tableCommands = [`rename`];
        if (!tableCommands.includes(args[2])) throw { status: 400, message: `Invalid arguments, The available args are: ${tableCommands.join(`, `)}` };
        if (args[2] === `rename`) {
            if (!checkPerms(`FES.database.update.table.*`, users, payload) || !checkPerms(`FES.database.update.table.name`, users, payload)) throw { status: 403, message: `You do not have permission to rename tables` };
            if (!args[3]) throw { status: 400, message: `Missing new name` };
            if (!/^[a-zA-Z0-9_-]+$/.test(args[3])) throw { status: 400, message: `Invalid filename`};
            if (fs.existsSync(join(__dirname, `/src/plugins/FES.database/${args[3]}.json`))) throw { status: 409, message: `Cannot Rename: Table with that name already exists` };
            fs.renameSync(join(__dirname, `/src/plugins/FES.database/${args[1]}.json`), join(__dirname, `/src/plugins/FES.database/${args[3]}.json`));
            return `Table ${args[1]} was renamed to ${args[3]}`;
        }
    } else if (args[0] === `column`) {
        if (!checkPerms(`FES.database.update.*`, users, payload) || !checkPerms(`FES.database.update.column`, users, payload)) throw { status: 403, message: `You do not have permission to update tables` };
        if (!args[1]) throw { status: 400, message: `Table name is required` };
        if (!fs.existsSync(join(__dirname, `src/plugins/FES.database/${args[1]}.json`))) throw { status: 404, message: `Table does not exist` };
        let table = JSON.parse(fs.readFileSync(join(__dirname, `src/plugins/FES.database/${args[1]}.json`), `utf-8`));

        if (args[2] === `all`) {
            if (!checkPerms(`FES.database.update.column.*`, users, payload) || !checkPerms(`FES.database.update.column.all`, users, payload)) throw { status: 403, message: `You do not have permission to update columns in all rows` };
            if (!payload?.entry?.fields) throw { status: 400, message: `Missing (fields) inside of (entry)`};
            if (args[3] === `--force`) {
                if (!checkPerms(`FES.database.update.column.*`, users, payload) || !checkPerms(`FES.database.update.column.all.force`, users, payload)) throw { status: 403, message: `You do not have permission to force change columns for all rows` };
                Object.entries(table).forEach(([id, item]) => { objectsChanged = objectsChanged + addFields(table, id, payload.entry.fields, { overwrite: true }); });
            } else if (typeof args[3] != `undefined` && args[3] != `--force`) throw { status: 400, message: `Invalid arguments, The available args are: all [--force]` };
            Object.entries(table).forEach(([id, item]) => {  objectsChanged = objectsChanged + addFields(table, id, payload.entry.fields, { overwrite: false }); });
            if (objectsChanged === 0) return { status: 200, message: `No new fields were updated to any rows in the table` };
            fs.writeFileSync(join(__dirname, `src/plugins/FES.database/${args[1]}.json`), JSON.stringify(table, null, 4));
            return `Column${objectsChanged > 1 ? `s` : ``}${args[3] === `--force` ? ` forcefully` : ``} updated in ${objectsChanged} row${objectsChanged > 1 ? `s` : ``}`;
 
        } else if (args[2] != `all` && typeof args[2] != `undefined`) throw { status: 400, message: `Invalid arguments, The available args are: all [--force]` }; 
        else {
            if (!payload?.entry?.id) throw { status: 400, message: `Missing (id): You need to provide a Row ID in the (entry) key`};
            addFields(table, payload.entry.id, payload.entry.fields, { overwrite: true });
            fs.writeFileSync(join(__dirname, `src/plugins/FES.database/${args[1]}.json`), JSON.stringify(table, null, 4));
            return `Column updated in row: ${args[1]}`;
        }
    }
}

async function Delete(args, payload, users, exposed) {
    if (!checkPerms(`FES.database.delete`, users, payload)) throw { status: 403, message: `You do not have permission to delete database entries` };
    const subCommands = [`table`, `row`, `column`];
    if (!subCommands.includes(args[0])) throw { status: 400, message: `Invalid arguments, The available args are: ${subCommands.join(", ")}` };
    if (args[0] === `table`) {
        if (!checkPerms(`FES.database.delete.*`, users, payload) || !checkPerms(`FES.database.delete.table`, users, payload)) throw { status: 403, message: `You do not have permission to delete tables` };
        if (!args[1]) throw { status: 400, message: `Table name is required` };
        if (args[1] === `all`) {
            let user = users[payload.userID];
            let tables = fs.readdirSync(join(__dirname, `src/plugins/FES.database`));
            if (tables.length <= 1) return `There are no deletable tables`;
            exposed.log(`User ${user.username} with ID ${user.id} deleted all ${tables.length - 1} tables! The tables that were affected were:\n${tables.join(`\n`).replace(`users.json`, `Saved: users.json (This file is protected and cannot be deleted)`)}`, { type: `warning` });
            tables.forEach(table => {
                if (table === `users.json`) return;
                fs.unlinkSync(join(__dirname, `src/plugins/FES.database/${table}`));
            });
            return `Deleted all ${tables.length - 1} tables in the database\n(I hope you knew what you were doing: https://www.google.com/search?&udm=2&q=When+you+delete+the+database+on+prod+meme)`;
        }
        
        if (!fs.existsSync(join(__dirname, `src/plugins/FES.database/${args[1]}.json`))) throw { status: 400, message: `Table does not exist` };
        fs.unlinkSync(join(__dirname, `src/plugins/FES.database/${args[1]}.json`));
        return `Table Deleted: ${args[1]}`;
    } else if (args[0] === `column`) {
        if (!checkPerms(`FES.database.update.*`, users, payload) || !checkPerms(`FES.database.update.column`, users, payload)) throw { status: 403, message: `You do not have permission to update tables` };
        if (!args[1]) throw { status: 400, message: `Table name is required` };
        if (!fs.existsSync(join(__dirname, `src/plugins/FES.database/${args[1]}.json`))) throw { status: 404, message: `Table does not exist` };
        let table = JSON.parse(fs.readFileSync(join(__dirname, `src/plugins/FES.database/${args[1]}.json`), `utf-8`));

        if (args[2] === `all`) {
            if (!checkPerms(`FES.database.update.column.*`, users, payload) || !checkPerms(`FES.database.update.column.all`, users, payload)) throw { status: 403, message: `You do not have permission to update columns in all rows` };
            if (!payload?.entry?.fields) throw { status: 400, message: `Missing (fields) inside of (entry)`};
            if (args[3] === `--force`) {
                if (!checkPerms(`FES.database.update.column.*`, users, payload) || !checkPerms(`FES.database.update.column.all.force`, users, payload)) throw { status: 403, message: `You do not have permission to force change columns for all rows` };
                Object.entries(table).forEach(([id, item]) => { objectsChanged = objectsChanged + addFields(table, id, payload.entry.fields, { overwrite: true }); });
            } else if (typeof args[3] != `undefined` && args[3] != `--force`) throw { status: 400, message: `Invalid arguments, The available args are: all [--force]` };
            Object.entries(table).forEach(([id, item]) => {  objectsChanged = objectsChanged + addFields(table, id, payload.entry.fields, { overwrite: false }); });
            if (objectsChanged === 0) return { status: 200, message: `No new fields were updated to any rows in the table` };
            fs.writeFileSync(join(__dirname, `src/plugins/FES.database/${args[1]}.json`), JSON.stringify(table, null, 4));
            return `Column${objectsChanged > 1 ? `s` : ``}${args[3] === `--force` ? ` forcefully` : ``} updated in ${objectsChanged} row${objectsChanged > 1 ? `s` : ``}`;
 
        } else if (args[2] != `all` && typeof args[2] != `undefined`) throw { status: 400, message: `Invalid arguments, The available args are: all [--force]` }; 
        else {
            if (!payload?.entry?.id) throw { status: 400, message: `Missing (id): You need to provide a Row ID in the (entry) key`};
            addFields(table, payload.entry.id, payload.entry.fields, { overwrite: true });
            fs.writeFileSync(join(__dirname, `src/plugins/FES.database/${args[1]}.json`), JSON.stringify(table, null, 4));
            return `Column updated in row: ${args[1]}`;
        }
    }
}


function checkPerms(permission, users, payload) {      
    const user = users[payload.userID];
    if (user.permissions.includes("*")) return true;
    if (user.permissions.includes(permission)) return true;
    return false;
}

function addFields(db, id, fields, { overwrite = false } = {}) {
    let Changed = 0;
    try {
        (db[id] ??= {});            
        Object.entries(fields).forEach(([key, value]) => {
            if (overwrite || !(key in db[id])) {
                db[id][key] = value;
                Changed++;
            }
        });
        return Changed;
    } catch (error) {
        console.log(`There was an error in FES.database`);
        console.error(error);
        throw { status: 500, message: `An Unknown Internal Server Error has accrued`};
    }
}

module.exports = { author, name, description, dependencies, enabled, version, run, Create, Update };