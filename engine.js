const resolve = require('object-path');
const defaultPerms = require('./crudPerms');
const PermissionError = require('./PermissionError');
const deepAssign=require('deep-assign');

function arrayToString(path) {
    return path.map((elem) => elem.toString());
}

function u_create(state, path, newObjName, newObjVal) {
    const newPath = path.concat([newObjName]);
    if (resolve.has(state, newPath))throw new PermissionError("Object already exists");
    resolve.set(state, newPath, newObjVal);
}

function u_del(state, path) {
    resolve.del(state, path);
}

function u_read(state, path) {
    return resolve.get(state, path);
}

function u_update(state, path, value) {
    resolve.set(state, path, value);
}

class ObjPermEngine {
    constructor(config) {
        this.config = deepAssign({
            PERM_KEY: '__permissions',
            USER_KEY: '__usr',
            WILDCARD: '*',

            USER_LEVEL: {
                ROOT: 0,
                USER: 1
            },
            DEFAULT_USER_LEVEL: Number.MAX_VALUE,

            permsModule: defaultPerms,
        }, config);
    }

    //returns path leading to perm tree
    _permTreePath(path) {
        return [this.config.PERM_KEY].concat(path);
    }

    //returns path leading to user table
    _userPath(path) {
        return [this.config.USER_KEY].concat(path);
    }

    //checks the level of user if its non root
    _isNonRoot(state, user) {
        return this.readUserLevel(state, user) > this.config.USER_LEVEL.ROOT;
    }

    //helps calculate a users permissions from the permtree (including wildcard)
    getPerm(permTree, user) {
        const permAll = permTree[this.config.PERM_KEY];
        if (permAll === undefined) return undefined;
        return this.config.permsModule.combine(permAll[this.config.WILDCARD] === undefined ? [] : permAll[this.config.WILDCARD], permAll[user]);
    }


    // user level ops

    readUserLevel(state, user) {
        const lvl = resolve.get(state, this._userPath([user]));
        if (lvl === undefined)return this.config.DEFAULT_USER_LEVEL;
        return lvl;
    }

    u_updateUserLevel(user, state, level) {
        resolve.set(state, this._userPath([user]), level);
    }

    updateUserLevel(srcUser, state, level) {
        if (this._isNonRoot(state, srcUser)) throw Error("Not enough permissions");
        this.u_updateUserLevel(srcUser, state, level);
    }


    //non permissioned operations

    _readPerms(idx, permTree, user, arr) {
        const perm = this.getPerm(permTree, user);
        if (idx === arr.length) return perm;
        const next = permTree[arr[idx].toString()];
        if (next === undefined)return perm;
        return this.config.permsModule.combine(perm, this._readPerms(idx + 1, next, user, arr))
    }

    readPerms(state, path, user) {
        if (path[0] === this.config.PERM_KEY) throw PermissionError("Illegal permtree access");
        return this._readPerms(0, state[this.config.PERM_KEY], user, path);
    }

    u_updatePerms(state, user, path, perms) {
        resolve.set(state, arrayToString(this._permTreePath(path).concat([this.config.PERM_KEY, user])), perms);
    }

    u_updatePerm(state, user, path, perm, value) {
        resolve.set(state, arrayToString(this._permTreePath(path).concat([this.config.PERM_KEY, user, perm])), value);
    }


    //permissioned operations

    updatePerms(srcUser, state, path, user, perms) {
        if (this._isNonRoot(state, srcUser))
            this.config.permsModule.updatePerms(
                this.readPerms(state, path, srcUser),
                this.readPerms(state, path, user));

        this.u_updatePerms(state, user, path, perms);
    }

    updatePerm(srcUser, state, path, user, perm, value) {
        if (this._isNonRoot(state, srcUser))
            this.config.permsModule.updatePerm(
                this.readPerms(state, path, srcUser),
                this.readPerms(state, path, user), perm);

        this.u_updatePerm(state, user, path, perm, value);
    }

    create(srcUser, state, path, newObjName, newObjVal) {
        if (this._isNonRoot(state, srcUser))
            this.config.permsModule.create(
                this.readPerms(state, path, srcUser));
        u_create(state, path, newObjName, newObjVal);
        this.u_updatePerms(state, srcUser, path.concat([newObjName]), this.config.permsModule.defaultCreatePerms);
    }

    del(srcUser, state, path) {
        if (this._isNonRoot(state, srcUser))
            this.config.permsModule.del(
                this.readPerms(state, path, srcUser));
        u_del(state, path);
    }

    read(srcUser, state, path) {
        if (this._isNonRoot(state, srcUser))
            this.config.permsModule.read(
                this.readPerms(state, path, srcUser));
        return u_read(state, path);
    }

    update(srcUser, state, path, value) {
        if (this._isNonRoot(state, srcUser))
            this.config.permsModule.update(
                this.readPerms(state, path, srcUser));
        u_update(state, path, value);
    }
}

module.exports = ObjPermEngine;