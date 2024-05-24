import config from "../config.ts";
import {type Chain, createPublicClient, http} from "viem";
import * as chains from "viem/chains";

const getChain = (chainId: number): Chain => {
    for (const chain of Object.values(chains)) {
        if ('id' in chain) {
            if (chain.id === chainId) {
                return chain;
            }
        }
    }

    throw new Error(`Chain with id ${chainId} not found`);
}

const client = createPublicClient({
    chain: getChain(config.chainId),
    transport: http(config.rpcUrl),
})

export default {
    client
}
