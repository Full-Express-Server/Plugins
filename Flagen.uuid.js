
/**
 * **The Name of the plugin**
 * @type { String }
 */
const name = `uuid`;

/**
 * **The Author of the plugin**
 * @type { String }
 */
const author = `Flagen`;

/**
 * **The Description of the plugin**
 * @type { String }
 */
const description = `Returns a random UUID.`;

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
 * **The Plugin Permission**
 * @type { Array }
 */
const permissions = [
    "*",
    "Flagen.uuid"
];

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
    if (payload?.firstStart) return;
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) { let r = Math.random() * 16 | 0, v = c == "x" ? r : (r & 0x3 | 0x8); return v.toString(16); });
}

module.exports = { author, description, enabled, name, permissions, run, version };