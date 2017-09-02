const resolve = require('object-path');

const wildcard = '*';
const permKey = "__permissions";
const objKey = "__obj";

const PERMS = {
    CREATE: 1,
    DELETE: 2,
    UPDATE: 3,
    READ: 4,
    UPDATE_PERMS: 5,
};

//helper functions
const ALL_PERMS = Object.values(PERMS).reduce(function (acc, val) {
    acc[val] = true;
    return acc;
}, {});

//ensures the permtree exists in the given object, and returns it
function pt(obj) {
    resolve.ensureExists(obj, permKey, {});
    return resolve.get(obj, permKey);
}

//ensures the actual object exists in the given state, and returns it
function o(obj) {
    resolve.ensureExists(obj, objKey, {});
    return resolve.get(obj, objKey);
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

//non permissioned operations
function _readPerms(idx, permTree, user, arr) {
    if (permTree === undefined) return [];
    const perm = getPerm(permTree, user);
    if (idx === arr.length) return perm;
    return combine(perm, _readPerms(idx + 1, permTree[arr[idx]], user, arr))
}
function readPerms(obj, path, user) {
    return _readPerms(0, pt(obj), user, path);
}
function _writePerms(obj, user, path, perms) {
    resolve.set(pt(obj), path.concat([permKey, user]), perms);
}
function _create(obj, path, newObjName, newObjVal) {
    resolve.set(o(obj), path.concat([newObjName]), newObjVal);
}
function _del(obj, path) {
    resolve.del(o(obj), path);
}
function _read(obj, path) {
    return resolve.get(o(obj), path);
}
function _update(obj, path, value) {
    resolve.set(o(obj), path, value);
}

//permissioned operations
function writePerms(srcUser, obj, path, user, perms) {
    if (readPerms(obj, path, srcUser)[perms.UPDATE_PERMS])return;
    if (readPerms(obj, path, user)[perms.UPDATE_PERMS])return;
    _writePerms(obj, user, perms);
}
function create(srcUser, obj, path, newObjName, newObjVal) {
    if (!readPerms(pt(obj), path, srcUser)[PERMS.CREATE])return;
    const newPath = path.concat([newObjName]);
    _create(obj, path, newObjName, newObjVal);
    _writePerms(obj, srcUser, newPath, ALL_PERMS);
}
function del(srcUser, obj, path) {
    if (!readPerms(pt(obj), path, srcUser)[PERMS.DELETE])return;
    _del(obj, path);
}
function read(srcUser, obj, path) {
    if (!readPerms(pt(obj), path, srcUser)[PERMS.READ]) return;
    return _read(obj, path);
}
function update(srcUser, obj, path, value) {
    if (!readPerms(pt(obj), path, srcUser)[PERMS.UPDATE]) return;
    _update(obj, path, value);
}

module.exports = {
    ...PERMS,
    ALL_PERMS: ALL_PERMS,

    readPerms: readPerms,
    _writePerms: _writePerms,
    _create: _create,
    _delete: _del,
    _read: _read,
    _update: _update,

    writePerms: writePerms,
    create: create,
    del: del,
    read: read,
    update: update,
};