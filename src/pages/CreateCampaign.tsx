import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { formatKES, formatAddress } from '@/lib/formatters';
import { ArrowLeft, Plus, Trash2, Save, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { connectWallet } from '@/lib/wallet';

interface MilestoneInput {
  description: string;
  amountKES: string;
}

const CreateCampaign = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [organiser, setOrganiser] = useState<{ walletAddress: string } | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    goalKES: '',
    deadline: '',
  });

  const [milestones, setMilestones] = useState<MilestoneInput[]>([
    { description: '', amountKES: '' }
  ]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMilestoneChange = (index: number, field: keyof MilestoneInput, value: string) => {
    const updated = [...milestones];
    updated[index][field] = value;
    setMilestones(updated);
  };

  const addMilestone = () => {
    setMilestones([...milestones, { description: '', amountKES: '' }]);
  };

  const removeMilestone = (index: number) => {
    if (milestones.length > 1) {
      setMilestones(milestones.filter((_, i) => i !== index));
    }
  };

  const calculateTotalMilestones = () => {
    return milestones.reduce((sum, m) => sum + (parseFloat(m.amountKES) || 0), 0);
  };

  const validateForm = (): string | null => {
    if (!formData.title.trim()) return 'Campaign title is required';
    if (!formData.description.trim()) return 'Campaign description is required';
    if (!formData.goalKES || parseFloat(formData.goalKES) <= 0) return 'Valid goal amount is required';
    if (!formData.deadline) return 'Deadline is required';

    const deadlineDate = new Date(formData.deadline);
    if (deadlineDate <= new Date()) return 'Deadline must be in the future';

    for (let i = 0; i < milestones.length; i++) {
      if (!milestones[i].description.trim()) return `Milestone ${i + 1} description is required`;
      if (!milestones[i].amountKES || parseFloat(milestones[i].amountKES) <= 0) {
        return `Milestone ${i + 1} amount must be greater than 0`;
      }
    }

    return null;
  };

  const handleOrganiserSignIn = async () => {
    try {
      setSigningIn(true);
      const { address } = await connectWallet();
      const result = await api.signInOrganiser({ walletAddress: address });
      const walletAddress = result.data?.organiser?.walletAddress || address;
      setOrganiser({ walletAddress });
      toast.success('Signed in as organiser', {
        description: formatAddress(walletAddress)
      });
    } catch (error) {
      console.error('Organiser sign-in failed:', error);
      toast.error('Failed to sign in as organiser');
    } finally {
      setSigningIn(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!organiser) {
      toast.error('Please sign in as an organiser before creating a campaign');
      return;
    }

    const error = validateForm();
    if (error) {
      toast.error(error);
      return;
    }

    try {
      setLoading(true);
      const deadlineTimestamp = Math.floor(new Date(formData.deadline).getTime() / 1000);

      const result = await api.createCampaign({
        creator: organiser.walletAddress,
        title: formData.title,
        description: formData.description,
        goalKES: parseFloat(formData.goalKES),
        deadline: deadlineTimestamp,
        milestones: milestones.map(m => ({
          description: m.description,
          amountKES: parseFloat(m.amountKES)
        }))
      });

      toast.success('Campaign created successfully!', {
        description: `Campaign ID: ${result.data.campaignId}`
      });

      navigate(`/campaign/${result.data.campaignId}`);
    } catch (error) {
      console.error('Failed to create campaign:', error);
      toast.error('Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  const totalMilestones = calculateTotalMilestones();
  const goal = parseFloat(formData.goalKES) || 0;
  // Removed isBalanced check as we no longer enforce milestone total to equal goal

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link to="/">
            <Button variant="ghost" className="mb-4 gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Create New Campaign
          </h1>
          <p className="text-muted-foreground">
            Launch a transparent, blockchain-secured fundraising campaign
          </p>
        </div>

        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Organiser Sign-In
              </h2>
              <p className="text-sm text-muted-foreground">
                Connect your wallet to sign in as an organiser before creating a campaign.
              </p>
              {organiser && (
                <p className="mt-2 text-sm text-foreground">
                  Signed in as <span className="font-mono">{formatAddress(organiser.walletAddress)}</span>
                </p>
              )}
            </div>
            <Button
              type="button"
              onClick={handleOrganiserSignIn}
              disabled={signingIn}
              className="gap-2"
            >
              {signingIn ? 'Connecting...' : organiser ? 'Change Wallet' : 'Connect Wallet'}
            </Button>
          </div>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Campaign Details
            </h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Campaign Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Robotics Club Equipment Fund"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.title.length}/100 characters
                </p>
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your project, what you'll do with the funds, and why it matters..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.description.length}/500 characters
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="goalKES">Funding Goal (KES) *</Label>
                  <Input
                    id="goalKES"
                    type="number"
                    placeholder="500000"
                    value={formData.goalKES}
                    onChange={(e) => handleInputChange('goalKES', e.target.value)}
                    min="1"
                  />
                  {formData.goalKES && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatKES(parseFloat(formData.goalKES))}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="deadline">Deadline *</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => handleInputChange('deadline', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Milestones */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Milestones
                </h2>
                <p className="text-sm text-muted-foreground">
                  Break down how you'll use the funds
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addMilestone}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Milestone
              </Button>
            </div>

            <div className="space-y-4">
              {milestones.map((milestone, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-medium text-foreground">
                      Milestone {index + 1}
                    </h3>
                    {milestones.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMilestone(index)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label htmlFor={`milestone-desc-${index}`}>Description *</Label>
                      <Input
                        id={`milestone-desc-${index}`}
                        placeholder="e.g., Purchase robotics parts and components"
                        value={milestone.description}
                        onChange={(e) => handleMilestoneChange(index, 'description', e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor={`milestone-amount-${index}`}>Amount (KES) *</Label>
                      <Input
                        id={`milestone-amount-${index}`}
                        type="number"
                        placeholder="300000"
                        value={milestone.amountKES}
                        onChange={(e) => handleMilestoneChange(index, 'amountKES', e.target.value)}
                        min="1"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Milestone Summary */}
            <div className="mt-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/20 rounded-xl border border-blue-100 dark:border-blue-800/50 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-full bg-blue-100 dark:bg-blue-900/50">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-400">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Funding Summary</span>
                </div>
                <div className="px-2.5 py-1 bg-white/80 dark:bg-gray-800/80 rounded-full text-xs font-medium text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800/50">
                  {milestones.length} {milestones.length === 1 ? 'Milestone' : 'Milestones'}
                </div>
              </div>
              
              <div className="space-y-3 mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Milestone Total</span>
                  <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                    {formatKES(totalMilestones)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Campaign Goal</span>
                  <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                    {formatKES(goal)}
                  </span>
                </div>
              </div>

              {totalMilestones > 0 && (
                <div className={`mt-4 p-3 rounded-lg ${
                  totalMilestones > goal 
                    ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50' 
                    : 'bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/50'
                }`}>
                  <div className="flex items-start gap-2">
                    <div className={`p-1 mt-0.5 rounded-full ${
                      totalMilestones > goal 
                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' 
                        : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                    }`}>
                      {totalMilestones > goal ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="8" x2="12" y2="12"></line>
                          <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                          <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${
                        totalMilestones > goal 
                          ? 'text-amber-700 dark:text-amber-300' 
                          : 'text-green-700 dark:text-green-300'
                      }`}>
                        {totalMilestones > goal 
                          ? `Milestone total exceeds goal by ${formatKES(totalMilestones - goal)}`
                          : `Milestone total: ${formatKES(goal - totalMilestones)} below goal`
                        }
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {totalMilestones > goal 
                          ? 'Consider adjusting milestone amounts to match your goal.' 
                          : 'You can add more amount to reach the campaign goal.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Info Box */}
          <Card className="p-6 bg-primary-light border-primary">
            <h3 className="font-semibold text-foreground mb-2">
              Before You Submit
            </h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>✓ Funds will be held in escrow until milestones are approved</li>
              <li>✓ Donors must vote to release funds for each milestone</li>
              <li>✓ If goal isn't reached by deadline, automatic refunds issued</li>
              <li>✓ All transactions are recorded on Avalanche blockchain</li>
            </ul>
          </Card>

          {/* Submit */}
          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={loading || !organiser || totalMilestones <= 0}
              className="flex-1 gap-2"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Creating Campaign...' : 'Create Campaign'}
            </Button>
            <Link to="/" className="flex-1">
              <Button type="button" variant="outline" className="w-full">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCampaign;
