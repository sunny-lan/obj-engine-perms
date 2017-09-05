const resolve = require('object-path');

class PermissionError extends Error {
}

const PERM_KEY = "__permissions";
const OBJ_KEY = "__obj";
const USER_KEY = "__users";

const IMPORTANT_KEY = "!";
const WILDCARD = '*';

const PERMS = {
    CREATE: "CRT",
    DELETE: "DEL",
    UPDATE: "UPD",
    READ: "RD",
    UPDATE_PERMS: "UPD_P",
};


const tmp = Object.keys(PERMS).reduce(function (acc, val) {
    acc[PERMS[val]] = true;
    return acc;
}, {});

PERMS.NONE = Object.keys(PERMS).reduce(function (acc, val) {
    acc[PERMS[val]] = false;
    return acc;
}, {});

PERMS.ALL = tmp;

const USER_LEVEL = {
    ROOT: 0,
    USER: 1
};

const DEFAULT_USER_LEVEL = Number.MAX_VALUE;


//helper functions

//returns path leading to perm tree
function pt(path) {
    return [PERM_KEY].concat(path);
}

//returns path leading to actual object
function o(path) {
    return [OBJ_KEY].concat(path);
}

//returns path leading to user tree
function u(path) {
    return [USER_KEY].concat(path);
}

//converts all path elements to string
function ps(path) {
    return path.map((elem) => elem.toString());
}

//checks the level of user if its non root
function ulr(state, user) {
    return readUserLevel(state, user) > USER_LEVEL.ROOT;
}

function combine(perm1, perm2) {
    if (perm2 === undefined) return perm1;
    let first = perm1, second = perm2;
    //important_key forces outer permissions to override permissions in child objects
    if (perm1[IMPORTANT_KEY]) {
        second = perm1;
        first = perm2;
    }
    let resPerm = [];
    for (let perm in first) if (first.hasOwnProperty(perm))
        resPerm[perm] = first[perm];
    for (let perm in second)if (second.hasOwnProperty(perm))
        resPerm[perm] = second[perm];
    return resPerm;
}

function getPerm(permTree, user) {
    const permAll = permTree[PERM_KEY];
    if (permAll === undefined) return undefined;
    return combine(permAll[WILDCARD] === undefined ? [] : permAll[WILDCARD], permAll[user]);
}


//non permissioned operations

function _readPerms(idx, permTree, user, arr) {
    const perm = getPerm(permTree, user);
    if (idx === arr.length) return perm;
    const next = permTree[arr[idx].toString()];
    if (next === undefined)return perm;
    return combine(perm, _readPerms(idx + 1, next, user, arr))
}
function readPerms(state, path, user) {
    return _readPerms(0, state[PERM_KEY], user, path);
}
function _updatePerms(state, user, path, perms) {
    resolve.set(state, ps(pt(path).concat([PERM_KEY, user])), perms);
}
function _updatePerm(state, user, path, perm, value) {
    resolve.set(state, ps(pt(path).concat([PERM_KEY, user, perm])), value);
}
function _create(state, path, newObjName, newObjVal) {
    const newPath = o(path).concat([newObjName]);
    if (resolve.has(state, newPath))throw new PermissionError("Object already exists");
    resolve.set(state, newPath, newObjVal);
}
function _del(state, path) {
    resolve.del(state, o(path));
}
function _read(state, path) {
    return resolve.get(state, o(path));
}
function _update(state, path, value) {
    resolve.set(state, o(path), value);
}
function readUserLevel(state, user) {
    const lvl = resolve.get(state, u([user]));
    if (lvl === undefined)return DEFAULT_USER_LEVEL;
    return lvl;
}
function _updateUserLevel(user, state, level) {
    resolve.set(state, u([user]), level);
}


//permissioned operations

function updatePerms(srcUser, state, path, user, perms) {
    if (ulr(state, srcUser)) {
        if (!readPerms(state, path, srcUser)[PERMS.UPDATE_PERMS])throw new PermissionError("Not enough perms");
        if (readPerms(state, path, user)[PERMS.UPDATE_PERMS])throw new PermissionError("Dst user has higher perms");
    }
    _updatePerms(state, user, path, perms);
}
function updatePerm(srcUser, state, path, user, perm, value) {
    if (ulr(state, srcUser)) {
        if (!readPerms(state, path, srcUser)[PERMS.UPDATE_PERMS])throw new PermissionError("Not enough perms");
        if (readPerms(state, path, user)[PERMS.UPDATE_PERMS])throw new PermissionError("Dst user has higher perms");
    }
    _updatePerm(state, user, path, perm, value);
}
function create(srcUser, state, path, newObjName, newObjVal) {
    if (ulr(state, srcUser))
        if (!readPerms(state, path, srcUser)[PERMS.CREATE])throw new PermissionError("Not enough perms");
    _create(state, path, newObjName, newObjVal);
    _updatePerms(state, srcUser, path.concat([newObjName]), PERMS.ALL);
}
function del(srcUser, state, path) {
    if (ulr(state, srcUser))
        if (!readPerms(state, path, srcUser)[PERMS.DELETE])throw new PermissionError("Not enough perms");
    _del(state, path);
}
function read(srcUser, state, path) {
    if (ulr(state, srcUser))
        if (!readPerms(state, path, srcUser)[PERMS.READ]) throw new PermissionError("Not enough perms");
    return _read(state, path);
}
function update(srcUser, state, path, value) {
    if (ulr(state, srcUser))
        if (!readPerms(state, path, srcUser)[PERMS.UPDATE]) throw new PermissionError("Not enough perms");
    _update(state, path, value);
}

function updateUserLevel(srcUser, state, level) {
    if (ulr(state, srcUser)) throw Error("Not enough permissions");
    _updateUserLevel(srcUser, state, level);
}


module.exports = {
    __KEYS: {
        PERM_KEY: PERM_KEY,
        USER_KEY: USER_KEY,
        OBJ_KEY: OBJ_KEY,
    },

    WILDCARD: WILDCARD,
    PERMS: PERMS,
    IMPORTANT_KEY: IMPORTANT_KEY,
    USER_LEVEL: USER_LEVEL,

    readUserLevel: readUserLevel,
    updateUserLevel: updateUserLevel,

    readPerms: readPerms,
    u_updatePerms: _updatePerms,
    u_updatePerm: _updatePerm,
    u_create: _create,
    u_delete: _del,
    u_read: _read,
    u_update: _update,

    updatePerms: updatePerms,
    updatePerm: updatePerm,
    create: create,
    del: del,
    read: read,
    update: update,
};