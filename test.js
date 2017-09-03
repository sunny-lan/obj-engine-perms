const p = require("./index");


const ROOT = "ROOT",
    USER1 = "U1",
    USER2 = "U2";

let state = {};

const cl = (...args) => console.log(...args, JSON.stringify(state, null, 4));

p.u_update(state, [], {
    serverTime: 100,
    entities: {
        "1": {
            speed: 3,
            location: 4
        }
    }
});
cl("Init state");

p.u_updatePerms(state, ROOT, [], Object.assign({"!": true}, p.PERMS.ALL));
p.u_updatePerm(state, p.WILDCARD, [], p.PERMS.READ, true);
cl("Permed #1");

p.create(ROOT, state, [], "serverSecret", {"secret stuff": "password123"});

cl("Created serverSecret");

p.updatePerm(ROOT, state, ["entities"], p.WILDCARD, p.PERMS.CREATE, true);
p.updatePerms(ROOT, state, ["serverSecret"], p.WILDCARD, p.PERMS.NONE);

cl("Permed #2");

p.create(USER1, state, ["entities"], "lkdsfj", {speed: 345, location: 666});

console.log("Attempting overwrite:");
try {
    p.create(USER2, state, ["entities"], "lkdsfj", {speed: 345234265, location: 643566});
} catch (e) {
    console.log("Overwrite successfully caught", e);
}

cl("Overwrite result");

p.create(USER2, state, ["entities"], "lkdsfj1", {speed: 34235, location: 6632656});

cl("BP #1");

console.log("Cross read", p.read(USER2, state, ["entities", "lkdsfj"]));

console.log("Attempting invalid write:");
try {
    p.update(USER1, state, ["entities", "lkdsfj1", "speed"], 24018);
} catch (e) {
    console.log("Invalid write successfully caught", e);
}
cl("Write result");

