import express from 'express';
import { z } from 'zod';
import { ethers } from 'ethers';
import { prisma } from '../lib/prisma.js';
import { getAVAXtoKESRate, convertKEStoAVAX } from '../services/priceService.js';

const router = express.Router();

const createCampaignSchema = z.object({
  creator: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  goalKES: z.number().int().positive(),
  deadline: z.number().int().positive(),
  milestones: z.array(
    z.object({
      description: z.string().min(1).max(255),
      amountKES: z.number().int().positive(),
    }),
  ).min(1),
});

function getContract() {
  const rpcUrl = process.env.AVALANCHE_RPC_URL;
  const contractAddress = process.env.CONTRACT_ADDRESS;
  const privateKey = process.env.PRIVATE_KEY;

  if (!rpcUrl || !contractAddress || !privateKey) {
    const error = new Error('Avalanche RPC URL, CONTRACT_ADDRESS, or PRIVATE_KEY not configured');
    error.status = 500;
    error.code = 'CONFIG_ERROR';
    throw error;
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  const abi = [
    'function createCampaign(string _title,string _description,uint256 _goalKES,uint256 _goalAVAX,uint256 _conversionRate,uint256 _deadline,string[] _milestoneDescriptions,uint256[] _milestoneAmountsKES,uint256[] _milestoneAmountsAVAX) external returns (uint256)',
    'function campaignCounter() view returns (uint256)',
  ];
  const contract = new ethers.Contract(contractAddress, abi, wallet);

  return { contract };
}

function mapCampaignToDto(campaign) {
  const now = Math.floor(Date.now() / 1000);
  const goalKES = campaign.goalKES;
  const totalDonationsKES = campaign.totalDonationsKES;
  const progress = goalKES > 0 ? Math.min(100, (totalDonationsKES / goalKES) * 100) : 0;
  const daysRemaining = Math.max(0, Math.ceil((campaign.deadline - now) / 86400));

  const goalAVAX = ethers.formatEther(campaign.goalAVAXWei);
  const totalDonationsAVAX = ethers.formatEther(campaign.totalDonationsAVAXWei);

  return {
    campaignId: campaign.onChainId,
    creator: campaign.creatorWallet,
    title: campaign.title,
    description: campaign.description,
    goalKES: campaign.goalKES,
    goalAVAX,
    totalDonationsAVAX,
    totalDonationsKES,
    conversionRate: campaign.conversionRate,
    conversionTimestamp: campaign.conversionTimestamp,
    deadline: campaign.deadline,
    goalReached: campaign.goalReached,
    finalized: campaign.finalized,
    donorCount: campaign.donations.length,
    milestonesCount: campaign.milestones.length,
    progress,
    daysRemaining,
  };
}

router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const [total, campaigns] = await Promise.all([
      prisma.campaign.count(),
      prisma.campaign.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { milestones: true, donations: true },
      }),
    ]);

    const items = campaigns.map(mapCampaignToDto);

    res.json({
      success: true,
      data: {
        campaigns: items,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Campaign id must be a number',
          details: {},
        },
      });
    }

    const campaign = await prisma.campaign.findUnique({
      where: { onChainId: id },
      include: { milestones: true, donations: true },
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Campaign not found',
          details: {},
        },
      });
    }

    const campaignDto = mapCampaignToDto(campaign);
    const donorCount = campaign.donations.length;

    const milestones = campaign.milestones.map((m) => {
      const totalVotes = m.votesFor + m.votesAgainst;
      const quorumReached = donorCount > 0 && totalVotes * 100 >= donorCount * 30;
      const approvalPercent = totalVotes > 0 ? Math.round((m.votesFor * 100) / totalVotes) : 0;
      const canFinalize = quorumReached && approvalPercent >= 50;

      return {
        index: m.index,
        description: m.description,
        amountKES: m.amountKES,
        amountAVAX: ethers.formatEther(m.amountAVAXWei),
        released: m.released,
        votesFor: m.votesFor,
        votesAgainst: m.votesAgainst,
        evidenceURI: m.evidenceURI || '',
        proposedAt: m.proposedAt || 0,
        voteProgress: {
          totalVotes,
          quorumReached,
          approvalPercent,
          canFinalize,
        },
      };
    });

    const donations = campaign.donations.map((d) => ({
      donor: d.donor,
      amountAVAX: ethers.formatEther(d.amountAVAXWei),
      amountKES: d.amountKES,
      timestamp: d.timestamp,
      transactionHash: d.txHash,
    }));

    res.json({
      success: true,
      data: {
        campaign: campaignDto,
        milestones,
        donations,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const parsed = createCampaignSchema.parse(req.body);

    const totalMilestones = parsed.milestones.reduce((sum, m) => sum + m.amountKES, 0);
    if (Math.abs(totalMilestones - parsed.goalKES) > 1) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MILESTONE_SUM_MISMATCH',
          message: 'Sum of milestone amounts must equal goal amount',
          details: {
            goalKES: parsed.goalKES,
            totalMilestones,
          },
        },
      });
    }

    const now = Math.floor(Date.now() / 1000);
    if (parsed.deadline <= now) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DEADLINE',
          message: 'Deadline must be in the future',
          details: {},
        },
      });
    }

    const price = await getAVAXtoKESRate();
    const kesPerAvax = price.KES_per_AVAX;
    const conversionRateInt = Math.round(kesPerAvax);

    const goalAVAXStr = convertKEStoAVAX(parsed.goalKES, kesPerAvax);
    const goalAVAXWei = ethers.parseEther(goalAVAXStr);

    const milestoneDescriptions = parsed.milestones.map((m) => m.description);
    const milestoneAmountsKES = parsed.milestones.map((m) => BigInt(m.amountKES));
    const milestoneAmountsAVAXWei = parsed.milestones.map((m) => {
      const avaxStr = convertKEStoAVAX(m.amountKES, kesPerAvax);
      return ethers.parseEther(avaxStr);
    });

    const { contract } = getContract();

    const tx = await contract.createCampaign(
      parsed.title,
      parsed.description,
      BigInt(parsed.goalKES),
      goalAVAXWei,
      BigInt(conversionRateInt),
      BigInt(parsed.deadline),
      milestoneDescriptions,
      milestoneAmountsKES,
      milestoneAmountsAVAXWei,
    );

    const receipt = await tx.wait();
    const counter = await contract.campaignCounter();
    const onChainIdBig = counter - 1n;
    const onChainId = Number(onChainIdBig);

    const organiser = await prisma.organiser.upsert({
      where: { walletAddress: parsed.creator.toLowerCase() },
      update: {},
      create: {
        walletAddress: parsed.creator.toLowerCase(),
      },
    });

    const conversionTimestamp = Math.floor(Date.now() / 1000);

    const campaign = await prisma.campaign.create({
      data: {
        onChainId,
        organiserId: organiser.id,
        creatorWallet: parsed.creator.toLowerCase(),
        title: parsed.title,
        description: parsed.description,
        goalKES: parsed.goalKES,
        goalAVAXWei,
        conversionRate: conversionRateInt,
        conversionTimestamp,
        deadline: parsed.deadline,
        milestones: {
          create: parsed.milestones.map((m, index) => ({
            index,
            description: m.description,
            amountKES: m.amountKES,
            amountAVAXWei: milestoneAmountsAVAXWei[index],
          })),
        },
      },
      include: { milestones: true, donations: true },
    });

    const campaignDto = mapCampaignToDto(campaign);

    res.json({
      success: true,
      data: {
        campaignId: onChainId,
        transactionHash: receipt.hash,
        contractAddress: process.env.CONTRACT_ADDRESS,
        campaign: campaignDto,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
