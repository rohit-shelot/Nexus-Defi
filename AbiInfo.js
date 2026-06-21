const erc20ABI = ["function decimals() public view returns (uint8)"]

const factoryABI = ["function getPair(address tokenA,address tokenB) external view returns (address pair)"]

const pairABI = [
    "function token0() external view returns (address)",
    "function token1() external view returns (address)",
    "function getReserves() external view returns (uint112 reserves0,uint112 reserves1,uint32 blockTimestampLast)",

]
const routerABI = [
  "function getAmountsOut(uint amountIn, address[] path) external view returns (uint[] amounts)"
];
module.exports={erc20ABI,factoryABI,pairABI,routerABI}