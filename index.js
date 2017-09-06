const Engine=require('./engine');
const PermErr=require('./PermissionError');
const crud=require('./crudPerms');
const nveo=require('./')

module.exports={
    ObjPermsEngine: Engine,
    PermissionError: PermErr,
    CRUDPerms: crud,

}