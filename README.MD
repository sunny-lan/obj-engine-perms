# obj-perms-engine

obj-perms-engine is a library based upon [object-path](https://www.npmjs.com/package/object-path).
It uses a simple user based model which allows control over which operations each user can apply on the object,
and where in the object they can apply those operations.

**Features:**

 - Simple CRUD based operation model
 - Stores permissions for user IDs, and also allows wildcard permissions
 - Permissions are cascaded down the object tree
 - Allows individual control of users access to CRUD operations
 - Default permission module can be easily replaced
 - "Root/Nonroot" system allows permissions to be overridden
 
Written using NodeJS version: **6.10.3**
 
## Naming conventions (IMPORTANT)

`state` - the object that is being operated upon. Note that a PERM_KEY will be added to the object to store permissions

`srcUser` - the user that is performing the said operation

`path` - an array of keys, used by this package to represent locations within objects. 
For example, take a look at the following object:

```json
{
  "a":{
    "b":10
  },
  "c":{
    "d":[12, 11, 15, 17],
    "e":true
  }
}
```

If we wanted to refer to the object at `"e"`, we would use the path `["a", "c", "e"]`.
If we wanted to refer to the root, we simply use an empty array: `[]`.

An integer value within a path will refer to an array index.
For example, the path `["c", "d", 2]` refers to the number 15 (inside array `"d"`).
 
## The operations

These are the operations that can be performed:

***The following examples will begin with the following snippet of code:*
```javascript
const ObjPermsEngine=require('obj-perms-engine').ObjPermsEngine;
const engine = new ObjPermsEngine();

let myState = {}; //this will store our state

// this is the object we will be operating on
const initialObject = {
    "a":{
        "b":10
    },
    "d":[12, 11, 15, 17]
};

//this will initialize our state to contain the object
engine.u_update(myState, [], initialObject);
```


### Create

`create(srcUser, state, path, newObjName, newObjVal)` - creates a new object at specified path. Example:
 
 **Javascript:**
 ```javascript
 engine.create("john", myState, ["a"], "money", 666);
 ```
 **Result:**
```javascript
object = {
  "a":{
    "b":10,
    "money":666
  },
   "d":[12, 11, 15, 17]
}
```

### Read

`read(srcUser, state, path)` - returns the object located at specified path. Example:

 **Operation:**
 ```javascript
 engine.read("john", myState, ["d", 1]);
 ```
 **Result:**
```javascript
returnValue = 11
```

### Update

`update(srcUser, state, path, value)` - updates the value of the object located at specified path. Example:

**Operation:**
```javascript
engine.update("john", myState, ["a", "b"], 456);
```

 **Result:**
```javascript
object = {
  "a":{
    "b":456
  },
   "d":[12, 11, 15, 17]
}
```

### Delete

`del(srcUser, state, path)` - deletes the object located at specified path. Example:

**Operation:**
```javascript
engine.del("john", myState, ["d"]);
```

**Result:**
```javascript
object = {
  "a":{
    "b":456
  }
}
```

## Basic permission system

By default, obj-perms-engine uses 5 permissions to control access to the object.
They should be pretty self explanatory:

 - CREATE - ability to create an object - represented in the code as the string `"CRT"`
 - READ - ability to read a value - represented in the code as the string `"RD"`
 - UPDATE - ability to update a value - represented in the code as the string `"UPD"`
 - DELETE - the ability to delete an object - represented in the code as the string `"DEL"`
 - UPDATE_PERMS - the ability to change permissions - represented in the code as the string `"UPD_P"`
 
These permissions are stored together in an object like this one:
```json
{
  "CRT": true,
  "DEL": true,
  "UPD_P": false
}
```
The object above would represent that CREATE and DELETE are allowed,
while UPDATE_PERMS is not allowed. Permissions that are `undefined` (READ and UPDATE)
will be set to their default values (see section on **Permission cascading**).

***The following examples will begin with the following snippet of code:*
```javascript
const objperms = require('obj-perms-engine');
const engine = new objperms.ObjPermsEngine();

//CRUDPerms is the name of the default permission module
const PERMS = objperms.CRUDPerms.PERMS; //CRUDPerms.PERMS contains the 5 permissions as constants

let myState = {}; //this will store our state

// this is the object we will be operating on
const initialObject = {
    "a":{
        "b":10
    },
    "d":[12, 11, 15, 17]
};

//ignore the following section for now
engine.u_update(myState, [], initialObject);
engine.u_updatePerm(myState,"john",["a", "b"], PERMS.UPDATE_PERMS,true );
engine.u_updatePerm(myState,"wendy", ["d"], PERMS.READ, true)
```

For reference, after the above section, our object will now look like this:
```javascript
obj={
  "a":{
      "b":10 // john has UPDATE_PERMS permissions here
  },
  "d":[12, 11, 15, 17] // wendy has READ permissions here
};
```

### Reading a permission

`readPerms(state, path, user)` - Reads the permissions for a certain user at a specified path.
Note that calling `readPerms` requires no permissions at all.

Example 1:

**Javascript:**
```javascript
engine.readPerms(myState, ["a", "b"], "john");
```

**Result:**
```javascript
returnValue={
    "UPD_P": true
}
```

Example 2:

**Javascript:**
```javascript
engine.readPerms(myState, ["a", "b"], "wendy");
```

**Result:**
```javascript
returnValue={
}
```

### Updating a permission

`updatePerm(srcUser, state, path, user, perm, value)` - Changes a permission for a certain user at a specified path.

**Javascript:**
```javascript
engine.updatePerms("john", myState, ["a", "b"], "wendy", PERMS.READ, true);
```

**Result:**

The object will now look like this:
```javascript
obj={
  "a":{
      "b":10 // john has UPDATE_PERMS permissions here, wendy has READ permissions here
  },
  "d":[12, 11, 15, 17] // wendy has READ permissions here
};
```

`updatePerms(srcUser, state, path, user, perms)` - Changes the permissions for a certain user at a specified path.

**Javascript:**
```javascript
engine.updatePerms("john", myState, ["a", "b"], "wendy", {"UPD": true, "RD": true, "DEL": false});
```

**Result:**

The object will now look like this:
```javascript
obj={
  "a":{
      "b":10 // john has UPDATE_PERMS permissions here, wendy has READ and UPDATE permissions here, but cannot DELETE
  },
  "d":[12, 11, 15, 17] // wendy has READ permissions here
};
```

## Permission cascading

As mentioned before, permissions will cascade down the object tree. Take a look at this object, for an example:
```javascript
obj={
      "a":{ // john has CREATE permissions here
          "b":10, //wendy has READ permissions here
          "c":{
              "e":5
          }
      },
      "d":[12, 11, 15, 17] // wendy has UPDATE permissions here
}
```

Because `"b"` is a child of `"a"`, by default, "john" will have CREATE permissions on `"b"`.
Similarly, he will also have CREATE permissions on "c", and "e".
This also applies to arrays; "wendy" will have UPDATE access to all the elements in array `"d"`.

## Configuration

The engine accepts a configuration object in its constructor:

```javascript
const ObjPermsEngine=require('obj-perms-engine').ObjPermsEngine;

const config={
    // configuration options here
};

const engine = new ObjPermsEngine(config);
```

The default configuration for the engine looks like this:

```javascript
config={
   PERM_KEY: '__permissions', //the key that the permission metadata will be stored in
   OBJ_KEY: '__obj', //the key that the actual object will be stored in
   USER_KEY: '__usr', //the key that the user levels will be stored in
   WILDCARD: '*', //the symbol to use to for wildcard

   USER_LEVEL: { //the availible user levels
       ROOT: 0,
       USER: 1
   },
   DEFAULT_USER_LEVEL: Number.MAX_VALUE, //the default user level

   permsModule: defaultPerms, //the permission module to use (CRUDPerms by default)
}
```

Any configuration value not provided by the user will be set to the value in the default config
