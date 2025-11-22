import axios from 'axios';
import { ethers } from 'ethers';

const CHAINLINK_AVAX_USD_FEED = '0x0A77230d17318075983913bC2145DB16C7366156'; // Fuji
const EXCHANGE_RATE_API = 'https://api.exchangerate.host/latest';
const FALLBACK_KES_PER_AVAX = parseFloat(process.env.FALLBACK_KES_PER_AVAX) || 146500;

export async function getAVAXtoKESRate() {
  try {
    // Get AVAX/USD from Chainlink
    const avaxUsdPrice = await getAVAXUSDPrice();

    // Get USD/KES from exchange API
    const usdKesRate = await getUSDtoKESRate();

    const kesPerAvax = avaxUsdPrice * usdKesRate;

    return {
      KES_per_AVAX: kesPerAvax,
      AVAX_per_KES: 1 / kesPerAvax,
      timestamp: Math.floor(Date.now() / 1000),
      sources: {
        AVAX_USD: 'chainlink',
        USD_KES: 'exchangerate.host',
      },
      AVAX_USD_price: avaxUsdPrice,
      USD_KES_rate: usdKesRate,
    };
  } catch (error) {
    console.warn('Price API failed, using fallback:', error.message);
    return {
      KES_per_AVAX: FALLBACK_KES_PER_AVAX,
      AVAX_per_KES: 1 / FALLBACK_KES_PER_AVAX,
      timestamp: Math.floor(Date.now() / 1000),
      sources: {
        AVAX_USD: 'fallback',
        USD_KES: 'fallback',
      },
      AVAX_USD_price: 35.0,
      USD_KES_rate: 4186.0,
    };
  }
}

async function getAVAXUSDPrice() {
  const provider = new ethers.JsonRpcProvider(process.env.AVALANCHE_RPC_URL);

  const aggregatorV3InterfaceABI = [
    {
      inputs: [],
      name: 'latestRoundData',
      outputs: [
        { name: 'roundId', type: 'uint80' },
        { name: 'answer', type: 'int256' },
        { name: 'startedAt', type: 'uint256' },
        { name: 'updatedAt', type: 'uint256' },
        { name: 'answeredInRound', type: 'uint80' },
      ],
      stateMutability: 'view',
      type: 'function',
    },
  ];

  const priceFeed = new ethers.Contract(
    CHAINLINK_AVAX_USD_FEED,
    aggregatorV3InterfaceABI,
    provider,
  );

  const roundData = await priceFeed.latestRoundData();
  const price = Number(roundData.answer) / 1e8; // Chainlink uses 8 decimals

  return price;
}

async function getUSDtoKESRate() {
  const response = await axios.get(EXCHANGE_RATE_API, {
    params: {
      base: 'USD',
      symbols: 'KES',
    },
  });

  return response.data.rates.KES;
}

export function convertKEStoAVAX(amountKES, kesPerAvax) {
  return (amountKES / kesPerAvax).toString();
}

export function convertAVAXtoKES(amountAVAX, kesPerAvax) {
  return Math.floor(parseFloat(amountAVAX) * kesPerAvax);
}
