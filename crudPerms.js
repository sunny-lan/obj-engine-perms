//crudPerms.js
//Permissions controlling the create, read, update, delete, and updatePerm operations individually

const PermissionError = require("./PermissionError");

const IMPORTANT_KEY = "!";

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

function updatePerms(srcUserPerms, perms) {
    if (!srcUserPerms[PERMS.UPDATE_PERMS])throw new PermissionError("Not enough perms");
    if (perms[PERMS.UPDATE_PERMS])throw new PermissionError("Dst user has higher perms");
}

function updatePerm(srcUserPerms, perms) {
    updatePerms(srcUserPerms, perms);
}

function create(perms) {
    if (!perms[PERMS.CREATE])throw new PermissionError("Not enough perms");
}

function del(perms) {
    if (!perms[PERMS.DELETE])throw new PermissionError("Not enough perms");
}

function read(perms) {
    if (!perms[PERMS.READ])throw new PermissionError("Not enough perms");
}

function update(perms) {
    if (!perms[PERMS.UPDATE])throw new PermissionError("Not enough perms");
}

module.exports = {
    PERMS: PERMS,
    IMPORTANT_KEY: IMPORTANT_KEY,
    combine: combine,
    updatePerms: updatePerms,
    updatePerm: updatePerm,
    create: create,
    del: del,
    read: read,
    update: update,
    defaultCreatePerms: PERMS.ALL,
};