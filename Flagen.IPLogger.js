//THIS IS THE FES EXAMPLE PLUGIN, This format is required!

/**
 * **The Name of the plugin**
 * @type { String }
 */
const name = `IPLogger`;

/**
 * **The Author of the plugin**
 * @type { String }
 */
const author = `Flagen`;

/**
 * **The Description of the plugin**
 * @type { String }
 */
const description = `A simple IP logger plugin.`;

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
const permissions = [ ];

/**
 * **The dependencies of the plugin**
 * @type { Array }
 */
const dependencies = [ ];

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
    const res = await fetch(`http://ip-api.com/json`);
    const data = await res.json();
    return data;
}
module.exports = { author, description, dependencies, enabled, name, run, version };