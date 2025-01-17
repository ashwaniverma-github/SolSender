"use strict";
const mongoose = require('mongoose');
console.log("connecting");
mongoose.connect('mongodb://localhost:27017/web3-mongo').then(() => {
    console.log("connected to db");
});
const UserSchema = mongoose.Schema({
    username: String,
    password: String,
    privateKey: String,
    publicKey: String
});
const UserModel = mongoose.model('user', UserSchema);
module.exports = {
    UserModel
};
