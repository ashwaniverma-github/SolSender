"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = require('express');
const z = require('zod');
require('dotenv').config();
const { UserModel } = require('./model');
const bcrypt = require('bcrypt');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const web3_js_1 = require("@solana/web3.js");
const app = express();
const port = 3000;
const bs58 = require('bs58');
app.use(express.json());
app.use(cors());
const userSchema = z.object({
    username: z.string().min(3),
    password: z.string().min(3)
});
const connection = new web3_js_1.Connection('https://solana-devnet.g.alchemy.com/v2/G3s0om4uIiXo3D5U56--mJznEaqQ1L70');
app.post('/api/v1/signup', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.body) {
        res.status(403).json({ message: "No inputs" });
    }
    const username = yield req.body.username;
    const password = yield req.body.password;
    const validateInputs = userSchema.safeParse({ username, password });
    if (!validateInputs.success) {
        return res.status(403).json({ message: "Wrong inputs" });
    }
    const existingUser = yield UserModel.findOne({
        username
    });
    if (existingUser) {
        res.status(400).json({ message: "user already exist signin" });
    }
    try {
        const saltRounds = 10;
        const hashedPassword = yield bcrypt.hash(password, saltRounds);
        const keypair = new web3_js_1.Keypair();
        const newUser = yield UserModel.create({
            username,
            password: hashedPassword,
            privateKey: keypair.secretKey.toString(),
            publicKey: keypair.publicKey.toString()
        });
        res.status(200).json({ message: keypair.publicKey.toString() });
    }
    catch (err) {
        res.status(404).json({ message: "error creating new user" });
        console.log(err);
    }
}));
app.post('/api/v1/signin', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    const user = yield UserModel.findOne({
        username
    });
    if (!user) {
        return res.status(403).json({ message: "User does not exist" });
    }
    const validPassword = yield bcrypt.compare(password, user.password);
    if (!validPassword) {
        res.status(403).json({ message: "Invalid password" });
    }
    const token = jwt.sign({
        id: username
    }, process.env.JWT_SECRET);
    res.json({ message: token });
}));
app.post('/api/v1/txn/sign', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const serializedTx = req.body.message;
    const tx = web3_js_1.Transaction.from(Buffer.from(serializedTx));
    if (!tx.feePayer) {
        return res.status(400).json({ message: "Transaction fee payer is undefined" });
    }
    const user = yield UserModel.findOne({
        publicKey: "Eb1e423TbxqfmFL8EAruXTWHf1xFevwr7YeHZjnkMNXE"
    });
    if (!user) {
        return res.status(403).json({ message: "User does not exist" });
    }
    const privateKeyArray = new Uint8Array(JSON.parse(`[${user.privateKey}]`));
    const keypair = web3_js_1.Keypair.fromSecretKey(privateKeyArray);
    tx.sign(keypair);
    console.log('before txn');
    const signature = yield connection.sendTransaction(tx, [keypair]);
    console.log('after txn');
    res.json({ message: signature });
}));
app.post('/api/v1/txn/?id=id', (req, res) => {
    res.json();
});
app.listen(port, () => {
    console.log(`app running at ${port}`);
});
