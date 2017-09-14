const Engine = require('../engine');
const should = require('chai').should();
const td = require("./engine_testdata");
const permModule = require("../crudPerms");
const PermissionError = require('../PermissionError');

const ROOT = "ROOT",
    USER1 = "U1",
    USER2 = "U2";

describe('u_updatePerms', () => it('should set permissions at path for user', () => {
    const testEngine = new Engine();
    let s = td.u_updatePerms.in;
    testEngine.u_updatePerms(s, ROOT, [], Object.assign({"!": true}, permModule.PERMS.ALL));
    s.should.deep.equal(td.u_updatePerms.out);
}));


describe('u_updatePerm', () => it("should set permission at path for user", () => {
    const testEngine = new Engine();
    let s = td.u_updatePerm.in;
    testEngine.u_updatePerm(s, testEngine.config.WILDCARD, [], permModule.PERMS.READ, true);
    s.should.deep.equal(td.u_updatePerm.out);
}));

describe("readPerms", () => it("should return permission of the user at path", () => {
    const testEngine = new Engine();
    let s = td.readPerms.in;
    testEngine.readPerms(s, [], USER2).should.deep.equal(td.readPerms.out);
}));

describe("create", () => {
    it("should allow user with PERMS.CREATE to create object at path; assigns PERMS.ALL to creator", () => {
        const testEngine = new Engine();
        let s = td.create.in;
        testEngine.create(ROOT, s, [], "serverSecret", {"secret stuff": "password123"});
        s.should.deep.equal(td.create.out);
    });

    it("should not allow user to overwrite an existing object", () => {
        const testEngine = new Engine();
        let s = td.create.in;
        (() => testEngine.create(USER2, s, ["entities"], "lkdsfj", {
            speed: 345234265,
            location: 643566
        })).should.throw(PermissionError);
    });

    it("should create arrays  with the correct permissions", () => {
        const testEngine = new Engine();
        let s = td.state_55;
        testEngine.create(USER1, s, ["entities"], "abc", []);
        s.should.deep.equal(td.state_98);
    });

    it("should create array elements with the correct permissions", () => {
        const testEngine = new Engine();
        let s = td.state_98;
        testEngine.create(USER1, s, ["entities", "abc"], 0, "test");
        s.should.deep.equal(td.state_99);
    });
});

describe("updatePerm", () => {
    it("should allow user with PERMS.UPDATE_PERMS to set single permission value of another user", () => {
        const testEngine = new Engine();
        let s = td.updatePerm.in;
        testEngine.updatePerm(ROOT, s, ["entities"], testEngine.config.WILDCARD, permModule.PERMS.CREATE, true);
        s.should.deep.equal(td.updatePerm.out);
    });
});

describe("updatePerms", () => {
    it("should allow user with PERMS.UPDATE_PERMS to set whole permission value of another user", () => {
        const testEngine = new Engine();
        let s = td.updatePerms.in;
        testEngine.updatePerms(ROOT, s, ["serverSecret"], testEngine.config.WILDCARD, permModule.PERMS.NONE);
        s.should.deep.equal(td.updatePerms.out);
    });

    it("should not allow user to set perms of a user that already has PERMS.UPDATE_PERMS", () => {
        const testEngine = new Engine();
        let s = td.state_55;
        (() => testEngine.updatePerms(USER1, s, ["entities", "lkdsfj"], ROOT, permModule.PERMS.NONE)).should.throw(PermissionError);
    });

    it("should set permissions for array elements", () => {
        const testEngine = new Engine();
        let s = td.state_99;
        testEngine.updatePerm(USER1, s, ["entities", "abc", 0], testEngine.config.WILDCARD, permModule.PERMS.READ, true);
        s.should.deep.equal(td.state_101);
    });
});

describe("update", () => {
    it("should allow user with PERMS.UPDATE to set value at path", () => {
        const testEngine = new Engine();
        let s = td.update.in;
        testEngine.update(USER1, s, ["entities", "lkdsfj", "speed"], 36623);
        s.should.deep.equal(td.update.out);
    });

    it("should not allow user without PERMS.UPDATE to set value at path", () => {
        const testEngine = new Engine();
        let s = td.state_55;
        (() => testEngine.update(USER1, s, ["entities", "lkdsfj1", "speed"], 24018)).should.throw(PermissionError);
    });
});

describe("read", () => {
    it("should allow user with PERMS.READ to get value at path", () => {
        const testEngine = new Engine();
        let s = td.read.in;
        testEngine.read(USER2, s, ["entities", "lkdsfj1", "location"]).should.deep.equal(td.read.out);
    });
    it("should not allow user without PERMS.READ to get value at path", () => {
        const testEngine = new Engine();
        let s = td.state_55;
        (() => testEngine.read(USER2, s, ["entities", "lkdsfj"])).should.throw(PermissionError);
    });
});

describe("del", () => it("should allow user with PERMS.DELETE to delete value at path", () => {
    const testEngine = new Engine();
    let s = td.del.in;
    testEngine.del(USER1, s, ["entities", "lkdsfj", "location"]);
    s.should.deep.equal(td.del.out);
}));