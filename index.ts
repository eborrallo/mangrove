import type {Address} from "./src/types.ts";
import providers from "./src/provider.ts";
import {erc20Abi} from "viem";
import {PromisePool} from "@supercharge/promise-pool";

const er20Address: Address = '0x4300000000000000000000000000000000000003'

const main = async () => {

    const wallets = await getLatestWalletsErc20Transfers(10)
    // The average time to mint a block on Blast is 2s
    // Also each block has between 10 and 20 transactions on average by block
    // So it means that every 2s potentially we can have data if you are looking for the las 10 transactions
    // But we need to take into account the rale limit on our RPC provider , if we dont have this limitation we can go with 2s if not I will recommend 10s
    /*
     setInterval(async function () {
         await getErc20BalancesFromWalletsChunked(wallets)
     }, 10_000) // 10 seconds
     */
    await getErc20BalancesFromWalletsChunked(wallets)

}

const getLatestWalletsErc20Transfers = async (numberOfTransfers: number): Promise<Array<Address>> => {

    try {
        console.time('getLatestWalletsErc20TransfersViem')
        const latestBlock = await providers.client.getBlockNumber();
        const startBlock = latestBlock - 20n;

        const logs = await providers.client.getContractEvents({
            address: er20Address,
            abi: erc20Abi,
            eventName: 'Transfer',
            fromBlock: startBlock,
            toBlock: latestBlock
        })

        const wallets: Set<Address> = new Set()
        for (let i = logs.length - 1; i >= 0; i--) {
            const from = logs[i].args.from as Address
            wallets.add(from)
            if (wallets.size === numberOfTransfers) {
                break;
            }
        }

        console.timeEnd('getLatestWalletsErc20TransfersViem')
        return [...new Set(wallets)]
    } catch
        (err: any) {
        throw new Error(`Error fetching logs ${err.toString()}`,);
    }
}


/**
 Future considerations

 If we want to fetch a big number of wallets it will fail in some moment because the blockchain has
 limits in terms of memory usage for view or pure functions and also the rpc could have his own limits in terms of
 memory usage, so we need to paginate the calls, and also we need to take into account the rate limit of the rpc provider

 I will recommend to paginate the calls in chunks of 100 wallets
 we can go between pages in a concurrency of 10 per second  in case fo my actual provider, but it will depend on yours
 **/
const getErc20BalancesFromWalletsChunked = async (wallets: Array<Address>): Promise<Array<string>> => {
    const chunks = (arr: Array<any>, n: number) => {
        const toReturn = []
        for (let i = 0; i < arr.length; i += n) {
            toReturn.push(arr.slice(i, i + n))
        }
        return toReturn
    }
    console.time('getErc20Balance')
    let responses: any = []
    const {errors} = await PromisePool
        .for(chunks(wallets, 100))
        .withConcurrency(1)
        .process(async chunk_wallets => {
            const res_wallets = await getErc20BalancesFromWallets(chunk_wallets)
            responses = [...responses, ...res_wallets]
        })
    if (errors.length > 0) {
        throw new Error(`Error fetching balance ${errors.join()}`)
    }
    console.timeEnd('getErc20Balance')
    return responses
}

const getErc20BalancesFromWallets = async (wallets: Array<Address>): Promise<Array<string>> => {
    const er20Contract = {
        address: er20Address,
        abi: erc20Abi
    } as const
    const res = await providers.client.multicall({
        contracts: wallets.map(wallet => ({
            ...er20Contract,
            functionName: 'balanceOf',
            args: [wallet]
        }))
    })
    return res.map(({result, error}) => {
        if (error) {
            throw new Error(`Error fetching balance ${JSON.stringify(error)}`)
        }
        return result!.toString()
    })
}

main()
