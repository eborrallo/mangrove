import * as dotenv from 'dotenv'
import {Networks} from "ethereum-multicall/dist/cjs/enums";

dotenv.config()

export type Config = {
    env: string,
    chainId: number,
    rpcUrl: string

}
const config: Config = {
    "env": process.env.NODE_ENV ?? 'develop',
    "chainId": process.env.CHAIN_ID ? parseInt(process.env.CHAIN_ID) : parseInt(Networks.blast.toString()),
    "rpcUrl": process.env.RPC_URL ?? "http://localhost:8545",
}


export default config
