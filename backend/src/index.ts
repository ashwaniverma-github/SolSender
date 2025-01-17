const express = require('express');
const z = require('zod')
require('dotenv').config();
const {UserModel} = require('./model')
const bcrypt = require('bcrypt')
const cors = require('cors')
const jwt = require('jsonwebtoken')
import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';
import { Request, Response } from 'express';
import { ConnectionStates } from 'mongoose';
const app = express();
const port = 3000;
const bs58 = require('bs58');
app.use(express.json())
app.use(cors())

const userSchema = z.object({
    username: z.string().min(3),
    password: z.string().min(3)
})

const connection = new Connection('https://solana-devnet.g.alchemy.com/v2/G3s0om4uIiXo3D5U56--mJznEaqQ1L70')

app.post('/api/v1/signup',async(req:Request,res:Response)=>{
    if(!req.body){
        res.status(403).json({message:"No inputs"})
    }
    const username = await  req.body.username;
    const password = await req.body.password;

    const validateInputs = userSchema.safeParse({username,password})
    if(!validateInputs.success){
        return res.status(403).json({message:"Wrong inputs"})
    }

    const existingUser = await UserModel.findOne({
        username
    })
    if(existingUser){
        res.status(400).json({message:"user already exist signin"})
    }
    try{
        const saltRounds = 10 
        const hashedPassword = await bcrypt.hash(password,saltRounds)
        const keypair = new Keypair()
        const newUser = await UserModel.create({
            username,
            password:hashedPassword,
            privateKey:keypair.secretKey.toString(),
            publicKey:keypair.publicKey.toString()
        })
        res.status(200).json({message:keypair.publicKey.toString()})
    }catch(err){
        res.status(404).json({message:"error creating new user"})
        console.log(err)
    }
})

app.post('/api/v1/signin',async(req:Request,res:Response)=>{
    const {username , password} = req.body
    const user = await UserModel.findOne({
        username
    })
    if(!user){
        return res.status(403).json({message:"User does not exist"})
    }
    const validPassword = await bcrypt.compare(password,user.password)
    if(!validPassword){
        res.status(403).json({message:"Invalid password"})
    }
    
    const token = jwt.sign({
        id:username
    },process.env.JWT_SECRET)

    res.json({message:token})

    

})

app.post('/api/v1/txn/sign',async(req:Request,res:Response)=>{
    const serializedTx = req.body.message

     const tx = Transaction.from(Buffer.from(serializedTx))

    if (!tx.feePayer) {
        return res.status(400).json({ message: "Transaction fee payer is undefined" });
    }
    const user = await UserModel.findOne({
        publicKey:"Eb1e423TbxqfmFL8EAruXTWHf1xFevwr7YeHZjnkMNXE"
    })

    if(!user){
        return res.status(403).json({message:"User does not exist"})
    }

    const privateKeyArray = new Uint8Array(JSON.parse(`[${user.privateKey}]`))

    const keypair = Keypair.fromSecretKey(privateKeyArray);

    tx.sign(keypair);
    console.log('before txn')
    const signature  = await connection.sendTransaction(tx,[keypair])
    console.log('after txn')
    res.json({message:signature})
    
})

app.post('/api/v1/txn/?id=id',(req:Request,res:Response)=>{
    res.json()
})

app.listen(port,()=>{
    console.log(`app running at ${port}`)
})