const p = require("./index");


const ROOT = "ROOT",
    USER1 = "U1",
    USER2 = "U2";

let state = {};

const cl = (...args) => console.log(...args, JSON.stringify(state, null, 4));

//Root tests
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
cl("Perm update root");

console.log("Read perms simple", p.readPerms(state, [], USER2));

//Simple tests
p.create(ROOT, state, [], "serverSecret", {"secret stuff": "password123"});
cl("Create simple #1");

p.updatePerm(ROOT, state, ["entities"], p.WILDCARD, p.PERMS.CREATE, true);
p.updatePerms(ROOT, state, ["serverSecret"], p.WILDCARD, p.PERMS.NONE);

cl("Perm update simple");

p.create(USER1, state, ["entities"], "lkdsfj", {speed: 345, location: 666});
p.create(USER2, state, ["entities"], "lkdsfj1", {speed: 34235, location: 6632656});
cl("Create simple #2");

p.update(USER1, state, ["entities", "lkdsfj", "speed"], 36623);
cl("Update simple");

console.log("Read simple", p.read(USER2, state, ["entities", "lkdsfj1", "location"]));

p.del(USER1, state, ["entities", "lkdsfj", "location"]);
cl("Del simple");

//Coverage tests

console.log("Attempting overwrite:");
try {
    p.create(USER2, state, ["entities"], "lkdsfj", {speed: 345234265, location: 643566});
    cl("Overwrite catch failed");
} catch (e) {
    console.log("Overwrite successfully caught", e);
}

console.log("Attempting invalid read:");
try {
     p.read(USER2, state, ["entities", "lkdsfj"]);
}catch(e){
    console.log("Invalid read successfully caught", e);
}

console.log("Attempting invalid write:");
try {
    p.update(USER1, state, ["entities", "lkdsfj1", "speed"], 24018);
    cl("Write catch failed");
} catch (e) {
    console.log("Invalid write successfully caught", e);
}

