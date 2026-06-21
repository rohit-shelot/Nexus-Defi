const ethers = require('ethers')
const {erc20ABI,factoryABI,pairABI,routerABI} = require('./AbiInfo')
const {FactoryAddress,routerAddress,fromAddress,toAddress} = require('./AddressList')

const provider = new ethers.providers.JsonRpcProvider("https://bsc-dataseed1.binance.org")
const factoryInstance = new ethers.Contract(
    FactoryAddress,factoryABI,provider
)
const rotuerInstance = new ethers.Contract(
    routerAddress,routerABI,provider
)

const priceFetch = async(amount)=>{
    const token1 = new ethers.Contract(
        fromAddress,erc20ABI,provider
    )
    const token2 = new ethers.Contract(
        toAddress,erc20ABI,provider
    )
    const decimal1 = await token1.decimals();
    const decimal2 = await token2.decimals();
    const amountsIn = ethers.utils.parseUnits(humanformat,decimal1).toString()
    const amountsOut = await rotuerInstance.getAmountsOut(amountsIn,[
        fromAddress,
        toAddress
    ])
    const humanOutput = ethers.utils.formatUnits(
        amountsOut[1].toString(),
        decimal2

    )
    console.log(humanOutput)
}
humanformat="200"
priceFetch()