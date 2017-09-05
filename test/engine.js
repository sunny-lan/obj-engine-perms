const p = require("../index");
const should = require('chai').should();
const k = p.__KEYS;
const td = require("./engine_testdata");

const ROOT = "ROOT",
    USER1 = "U1",
    USER2 = "U2";

describe('u_update', () => it("should update the tree to a value", () => {
    let s = {};
    p.u_update(s, [], td.u_update.in);
    s.should.deep.equal(td.u_update.out);
}));

describe('u_updatePerms', () => it('should set permissions at path for user', () => {
    let s = td.u_updatePerms.in;
    p.u_updatePerms(s, ROOT, [], Object.assign({"!": true}, p.PERMS.ALL));
    s.should.deep.equal(td.u_updatePerms.out);
}));


describe('u_updatePerm', () => it("should set permission at path for user", () => {
    let s = td.u_updatePerm.in;
    p.u_updatePerm(s, p.WILDCARD, [], p.PERMS.READ, true);
    s.should.deep.equal(td.u_updatePerm.out);
}));

describe("readPerms", () => it("should return permission of the user at path", () => {
    let s = td.readPerms.in;
    p.readPerms(s, [], USER2).should.deep.equal(td.readPerms.out);
}));

describe("create", () => it("should allow user with PERMS.CREATE to create object at path; assigns PERMS.ALL to creator", () => {
    let s = td.create.in;
    p.create(ROOT, s, [], "serverSecret", {"secret stuff": "password123"});
    s.should.deep.equal(td.create.out);
}));

describe("updatePerm", () => it("should allow user with PERMS.UPDATE_PERMS to set single permission value of another user", () => {
    let s = td.updatePerm.in;
    p.updatePerm(ROOT, s, ["entities"], p.WILDCARD, p.PERMS.CREATE, true);
    s.should.deep.equal(td.updatePerm.out);
}));

describe("updatePerms", () => it("should allow user with PERMS.UPDATE_PERMS to set whole permission value of another user", () => {
    let s = td.updatePerms.in;
    p.updatePerms(ROOT, s, ["serverSecret"], p.WILDCARD, p.PERMS.NONE);
    s.should.deep.equal(td.updatePerms.out);
}));

describe("update", () => it("should allow user with PERMS.UPDATE to set value at path", () => {
    let s = td.update.in;
    p.update(USER1, s, ["entities", "lkdsfj", "speed"], 36623);
    s.should.deep.equal(td.update.out);
}));

describe("read", () => it("should allow user with PERMS.READ to get value at path", () => {
    let s = td.read.in;
    p.read(USER2, s, ["entities", "lkdsfj1", "location"]).should.deep.equal(td.read.out);
}));

describe("del", () => it("should allow user with PERMS.DELETE to delete value at path", () => {
    let s = td.del.in;
    p.del(USER1, s, ["entities", "lkdsfj", "location"]);
    s.should.deep.equal(td.del.out);
}));