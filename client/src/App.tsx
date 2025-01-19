import { Transaction , Connection, SystemProgram, PublicKey, LAMPORTS_PER_SOL ,  } from '@solana/web3.js'
import './App.css'
import { useState } from 'react'
import axios from 'axios'

function App() {
  const [fromPubkey , setFromPubKey] = useState<string | undefined>()
  const [toPubkey , setToPubkey] = useState<string | undefined>()
  const [sol , setSol] = useState<number | undefined>()
  const [txnSignature , setTxnSignature] = useState<string | undefined>()
  

  const connection = new Connection('https://solana-devnet.g.alchemy.com/v2/G3s0om4uIiXo3D5U56--mJznEaqQ1L70')
  async function Send(){
    if (!fromPubkey || !toPubkey || !sol) {
      console.error("Invalid input");
      return;
    }

    const fromPublicKey = new PublicKey(fromPubkey);
    const toPublicKey = new PublicKey(toPubkey);

    const ix = SystemProgram.transfer({
      fromPubkey: fromPublicKey,
      toPubkey: toPublicKey,
      lamports: sol * LAMPORTS_PER_SOL
    })

    const tx = new Transaction().add(ix)

    const {blockhash} = await connection.getLatestBlockhash()
    tx.recentBlockhash = blockhash
    tx.feePayer = fromPublicKey

    const serializedTx = tx.serialize({
      requireAllSignatures:false,
      verifySignatures:false
    })
    console.log(serializedTx)

    const response  = await axios.post('http://localhost:3000/api/v1/txn/sign',{
      message:serializedTx,
      retry:false
    })
    console.log(response.data.message)
    setTxnSignature(response.data.message)
  }
  return (
    <>
    <p>Your transaction signature -{txnSignature}</p>
    <input onChange={((e)=>{
      setFromPubKey(e.target.value)
    })} type='text' placeholder='from' />
   
    <input onChange={((e)=>{
      setToPubkey(e.target.value)
    })} type='text' placeholder='to' />
    <br />
    <input onChange={((e)=>{
      setSol(Number(e.target.value))
    })} type="number" placeholder='sol'/>
    <br />
    <button onClick={Send} >Send</button>
    </>

    
  )
}

export default App
