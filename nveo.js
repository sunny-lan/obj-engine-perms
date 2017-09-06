//nveoPerms.js
//Permissions based on user levels of NONE, VIEWER, EDITOR, and OWNER

const PermissionError = require("./PermissionError");

const IMPORTANT_KEY = "!";

const PERMS = {
    OWNER: 4,
    EDITOR: 3,
    VIEWER: 2,
    NONE: 1,
};

function combine(perm1, perm2) {
    if (perm2 === undefined) return perm1;
    //important_key forces outer permissions to override permissions in child objects
    if (perm1[IMPORTANT_KEY])
        return perm1;

    return perm2;
}

function updatePerms(srcUserPerms, perms) {
    if (srcUserPerms.lvl < PERMS.OWNER)throw new PermissionError("Not enough perms");
    // if (perms.lvl >= PERMS.OWNER)throw new PermissionError("Dst user has higher perms");
}

function updatePerm(srcUserPerms, perms) {
    updatePerms(srcUserPerms, perms);
}

function create(perms) {
    if (perms.lvl < PERMS.OWNER)throw new PermissionError("Not enough perms");
}

function del(perms) {
    if (perms.lvl < PERMS.OWNER)throw new PermissionError("Not enough perms");
}

function read(perms) {
    if (perms.lvl < PERMS.VIEWER)throw new PermissionError("Not enough perms");
}

function update(perms) {
    if (perms.lvl < PERMS.EDITOR)throw new PermissionError("Not enough perms");
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
    defaultCreatePerms: PERMS.OWNER,
};