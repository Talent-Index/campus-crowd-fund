import { Campaign, Milestone, Donation, PriceData } from '@/types/campaign';

// For demo purposes, we'll use mock data
// In production, this would connect to the actual backend API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
// Default to mock mode unless VITE_USE_MOCK_DATA is explicitly set to 'false'
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA !== 'false';

// Mock data generator
const generateMockCampaigns = (): Campaign[] => {
  return [
    {
      campaignId: 0,
      creator: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      title: 'Robotics Club Equipment Fund',
      description: 'Raise funds to purchase robotics parts and equipment for the national competition. Our team needs sensors, motors, and controllers to build our competition robot.',
      goalKES: 500000,
      goalAVAX: '3.412969283276',
      totalDonationsAVAX: '2.8',
      totalDonationsKES: 410200,
      conversionRate: 146500,
      conversionTimestamp: Math.floor(Date.now() / 1000) - 86400,
      deadline: Math.floor(Date.now() / 1000) + 86400 * 30,
      goalReached: false,
      finalized: false,
      donorCount: 12,
      milestonesCount: 2,
      progress: 82.04,
      daysRemaining: 30
    },
    {
      campaignId: 1,
      creator: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
      title: 'Hackathon Travel Fund',
      description: 'Support our team\'s journey to the Silicon Savannah Hackathon in Nairobi. Funds will cover transport, accommodation, and registration fees.',
      goalKES: 250000,
      goalAVAX: '1.706484641638',
      totalDonationsAVAX: '1.9',
      totalDonationsKES: 278350,
      conversionRate: 146500,
      conversionTimestamp: Math.floor(Date.now() / 1000) - 172800,
      deadline: Math.floor(Date.now() / 1000) + 86400 * 15,
      goalReached: true,
      finalized: false,
      donorCount: 18,
      milestonesCount: 1,
      progress: 111.34,
      daysRemaining: 15
    },
    {
      campaignId: 2,
      creator: '0x1a2B3c4D5e6F7a8B9c0D1e2F3a4B5c6D7e8F9a0B',
      title: 'Charity Drive - School Supplies',
      description: 'Provide school supplies and textbooks for 50 students in underprivileged communities. Every contribution makes education accessible.',
      goalKES: 350000,
      goalAVAX: '2.389078897993',
      totalDonationsAVAX: '1.2',
      totalDonationsKES: 175800,
      conversionRate: 146500,
      conversionTimestamp: Math.floor(Date.now() / 1000) - 259200,
      deadline: Math.floor(Date.now() / 1000) + 86400 * 45,
      goalReached: false,
      finalized: false,
      donorCount: 8,
      milestonesCount: 3,
      progress: 50.23,
      daysRemaining: 45
    }
  ];
};

const generateMockMilestones = (campaignId: number): Milestone[] => {
  if (campaignId === 0) {
    return [
      {
        index: 0,
        description: 'Purchase robotics parts and components',
        amountKES: 300000,
        amountAVAX: '2.047781569966',
        released: false,
        votesFor: 8,
        votesAgainst: 2,
        evidenceURI: 'ipfs://QmExample123/parts-receipt.pdf',
        proposedAt: Math.floor(Date.now() / 1000) - 86400,
        voteProgress: {
          totalVotes: 10,
          quorumReached: true,
          approvalPercent: 80,
          canFinalize: true
        }
      },
      {
        index: 1,
        description: 'Travel and accommodation for competition',
        amountKES: 200000,
        amountAVAX: '1.365187713310',
        released: false,
        votesFor: 0,
        votesAgainst: 0,
        evidenceURI: '',
        proposedAt: 0,
        voteProgress: {
          totalVotes: 0,
          quorumReached: false,
          approvalPercent: 0,
          canFinalize: false
        }
      }
    ];
  }
  return [];
};

const generateMockDonations = (campaignId: number): Donation[] => {
  const donors = [
    '0x1234567890123456789012345678901234567890',
    '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    '0x9876543210987654321098765432109876543210'
  ];
  
  return donors.map((donor, i) => ({
    donor,
    amountAVAX: (Math.random() * 2).toFixed(6),
    amountKES: Math.floor(Math.random() * 150000 + 50000),
    timestamp: Math.floor(Date.now() / 1000) - 86400 * (i + 1),
    transactionHash: `0x${Math.random().toString(16).slice(2, 66)}`
  }));
};

export const api = {
  // Price conversion
  async getPrice(): Promise<PriceData> {
    if (USE_MOCK_DATA) {
      return {
        KES_per_AVAX: 146500,
        AVAX_per_KES: 0.00000683,
        timestamp: Math.floor(Date.now() / 1000),
        sources: {
          AVAX_USD: 'chainlink',
          USD_KES: 'exchangerate.host'
        },
        AVAX_USD_price: 35.50,
        USD_KES_rate: 4126.76
      };
    }
    
    const response = await fetch(`${API_BASE_URL}/price/avax-kes`);
    return response.json();
  },

  // Campaign operations
  async getCampaigns(): Promise<{ campaigns: Campaign[] }> {
    if (USE_MOCK_DATA) {
      return { campaigns: generateMockCampaigns() };
    }
    
    const response = await fetch(`${API_BASE_URL}/campaigns`);
    const data = await response.json();
    return data.data;
  },

  async getCampaign(id: number): Promise<{ campaign: Campaign; milestones: Milestone[]; donations: Donation[] }> {
    if (USE_MOCK_DATA) {
      const campaigns = generateMockCampaigns();
      const campaign = campaigns.find(c => c.campaignId === id);
      if (!campaign) throw new Error('Campaign not found');
      
      return {
        campaign,
        milestones: generateMockMilestones(id),
        donations: generateMockDonations(id)
      };
    }
    
    const response = await fetch(`${API_BASE_URL}/campaigns/${id}`);
    const data = await response.json();
    return data.data;
  },

  async createCampaign(params: {
    creator: string;
    title: string;
    description: string;
    goalKES: number;
    deadline: number;
    milestones: Array<{ description: string; amountKES: number }>;
  }) {
    if (USE_MOCK_DATA) {
      return {
        success: true,
        data: {
          campaignId: 3,
          transactionHash: `0x${Math.random().toString(16).slice(2, 66)}`,
          ...params
        }
      };
    }
    
    const response = await fetch(`${API_BASE_URL}/campaigns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return response.json();
  },

  async donate(campaignId: number, donor: string, amountKES: number) {
    if (USE_MOCK_DATA) {
      return {
        success: true,
        data: {
          transactionHash: `0x${Math.random().toString(16).slice(2, 66)}`,
          donor,
          amountKES
        }
      };
    }
    
    const response = await fetch(`${API_BASE_URL}/campaigns/${campaignId}/donate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ donor, amountKES })
    });
    return response.json();
  },

  async proposeMilestone(campaignId: number, milestoneIndex: number, creator: string, evidenceURI: string) {
    if (USE_MOCK_DATA) {
      return {
        success: true,
        data: {
          transactionHash: `0x${Math.random().toString(16).slice(2, 66)}`
        }
      };
    }
    
    const response = await fetch(`${API_BASE_URL}/campaigns/${campaignId}/milestones/${milestoneIndex}/propose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creator, evidenceURI })
    });
    return response.json();
  },

  async voteOnMilestone(campaignId: number, milestoneIndex: number, voter: string, approve: boolean) {
    if (USE_MOCK_DATA) {
      return {
        success: true,
        data: {
          transactionHash: `0x${Math.random().toString(16).slice(2, 66)}`
        }
      };
    }
    
    const response = await fetch(`${API_BASE_URL}/campaigns/${campaignId}/milestones/${milestoneIndex}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voter, approve })
    });
    return response.json();
  },

  async finalizeMilestone(campaignId: number, milestoneIndex: number, caller: string) {
    if (USE_MOCK_DATA) {
      return {
        success: true,
        data: {
          transactionHash: `0x${Math.random().toString(16).slice(2, 66)}`
        }
      };
    }
    
    const response = await fetch(`${API_BASE_URL}/campaigns/${campaignId}/milestones/${milestoneIndex}/finalize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caller })
    });
    return response.json();
  },

  async signInOrganiser(params: { walletAddress: string; name?: string; email?: string }) {
    if (USE_MOCK_DATA) {
      return {
        success: true,
        data: {
          organiser: {
            id: 1,
            walletAddress: params.walletAddress,
            name: params.name ?? null,
            email: params.email ?? null,
            createdAt: new Date().toISOString()
          }
        }
      };
    }

    const response = await fetch(`${API_BASE_URL}/organisers/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return response.json();
  }
};
