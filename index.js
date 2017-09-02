const resolve = require('object-path');

const wildcard = '*';
const permKey = "__permissions";

const PERMS = {
    CREATE: 1,
    DELETE: 2,
    UPDATE: 3,
    READ: 4,
    UPDATE_PERMS: 5,
};

const ALL_PERMS = Object.values(PERMS).reduce(function (acc, val) {
    acc[val] = true;
    return acc;
}, {});

function dp(obj) {
    resolve.ensureExists(obj, permKey, {});
    return resolve.get(obj, permKey);
}

function combine(perm1, perm2) {
    if (perm1.important) return perm1;
    if (perm2 !== undefined) return perm2;
    return perm1;
}

function getPerm(permTree, user) {
    const permAll = permTree[permKey];
    if (permAll === undefined) return undefined;
    let permUser = permAll[user];
    if (permUser === undefined) permUser = permAll[wildcard];
    return permUser;
}

function _readPerms(idx, permTree, user, arr) {
    if (permTree === undefined) return [];

    const perm = getPerm(permTree, user);
    if (idx === arr.length) return perm;

    return combine(perm, _readPerms(idx + 1, permTree[arr[idx]], user, arr))
}
function readPerms(obj, path, user) {
    return _readPerms(0, dp(obj), user, path);
}

function _writePerms(permTree, user, path, perms) {
    resolve.set(permTree, path.concat([permKey, user]), perms);
}
function writePerms(srcUser, obj, path, user, perms) {
    obj = dp(obj);
    if (readPerms(obj, path, srcUser)[perms.UPDATE_PERMS])return;
    if (readPerms(obj, path, user)[perms.UPDATE_PERMS])return;
    _writePerms(obj, user, perms);
}

function create(srcUser, obj, path, newObjName, newObjVal) {
    const permTree = dp(obj);
    if (!readPerms(permTree, path, srcUser)[PERMS.CREATE])return;
    const newPath = path.concat([newObjName]);
    resolve.set(obj, newPath, newObjVal);
    _writePerms(permTree, srcUser, newPath, ALL_PERMS);
}

function del(srcUser, obj, path) {
    if (!readPerms(dp(obj), path, srcUser)[PERMS.DELETE])return;
    resolve.del(obj, path);
}

function read(srcUser, obj, path) {
    if (!readPerms(dp(obj), path, srcUser)[PERMS.READ]) return;
    return resolve.get(obj, path);
}

function update(srcUser, obj, path, value) {
    if (!readPerms(dp(obj), path, srcUser)[PERMS.UPDATE]) return;
    resolve.set(obj, path, value);
}

module.exports = {
    ...PERMS,
    ALL_PERMS: ALL_PERMS,

    readPerms: readPerms,
    writePerms: writePerms,
    create: create,
    del: del,
    read: read,
    update: update,
};