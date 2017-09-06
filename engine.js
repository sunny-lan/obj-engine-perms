const resolve = require('object-path');
const defaultPerms = require('./crudPerms');
const PermissionError=require('./PermissionError');

function arrayToString(path) {
    return path.map((elem) => elem.toString());
}

class ObjPermEngine {
    constructor(config) {
        this.config = Object.assign({
            PERM_KEY: '__permissions',
            OBJ_KEY: '__obj',
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

    //returns path leading to actual object
    _objPath(path) {
        return [this.config.OBJ_KEY].concat(path);
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
        _updateUserLevel(srcUser, state, level);
    }


    //non permissioned operations

    u_readPerms(idx, permTree, user, arr) {
        const perm = this.getPerm(permTree, user);
        if (idx === arr.length) return perm;
        const next = permTree[arr[idx].toString()];
        if (next === undefined)return perm;
        return this.config.permsModule.combine(perm, this.u_readPerms(idx + 1, next, user, arr))
    }

    readPerms(state, path, user) {
        return this.u_readPerms(0, state[this.config.PERM_KEY], user, path);
    }

    u_updatePerms(state, user, path, perms) {
        resolve.set(state, arrayToString(this._permTreePath(path).concat([this.config.PERM_KEY, user])), perms);
    }

    u_updatePerm(state, user, path, perm, value) {
        resolve.set(state, arrayToString(this._permTreePath(path).concat([this.config.PERM_KEY, user, perm])), value);
    }

    u_create(state, path, newObjName, newObjVal) {
        const newPath = this._objPath(path).concat([newObjName]);
        if (resolve.has(state, newPath))throw new PermissionError("Object already exists");
        resolve.set(state, newPath, newObjVal);
    }

    u_del(state, path) {
        resolve.del(state, this._objPath(path));
    }

    u_read(state, path) {
        return resolve.get(state, this._objPath(path));
    }

    u_update(state, path, value) {
        resolve.set(state, this._objPath(path), value);
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
        this.u_create(state, path, newObjName, newObjVal);
        this.u_updatePerms(state, srcUser, path.concat([newObjName]), this.config.permsModule.defaultCreatePerms);
    }

    del(srcUser, state, path) {
        if (this._isNonRoot(state, srcUser))
            this.config.permsModule.del(
                this.readPerms(state, path, srcUser));
        this.u_del(state, path);
    }

    read(srcUser, state, path) {
        if (this._isNonRoot(state, srcUser))
            this.config.permsModule.read(
                this.readPerms(state, path, srcUser));
        return this.u_read(state, path);
    }

    update(srcUser, state, path, value) {
        if (this._isNonRoot(state, srcUser))
            this.config.permsModule.update(
                this.readPerms(state, path, srcUser));
        this.u_update(state, path, value);
    }
}

module.exports = ObjPermEngine;