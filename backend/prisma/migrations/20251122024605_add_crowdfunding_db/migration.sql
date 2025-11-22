-- CreateTable
CREATE TABLE "Organiser" (
    "id" SERIAL NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organiser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" SERIAL NOT NULL,
    "onChainId" INTEGER NOT NULL,
    "organiserId" INTEGER NOT NULL,
    "creatorWallet" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "goalKES" INTEGER NOT NULL,
    "goalAVAXWei" BIGINT NOT NULL,
    "conversionRate" INTEGER NOT NULL,
    "conversionTimestamp" INTEGER NOT NULL,
    "deadline" INTEGER NOT NULL,
    "totalDonationsAVAXWei" BIGINT NOT NULL DEFAULT 0,
    "totalDonationsKES" INTEGER NOT NULL DEFAULT 0,
    "goalReached" BOOLEAN NOT NULL DEFAULT false,
    "finalized" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Milestone" (
    "id" SERIAL NOT NULL,
    "campaignId" INTEGER NOT NULL,
    "index" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "amountKES" INTEGER NOT NULL,
    "amountAVAXWei" BIGINT NOT NULL,
    "released" BOOLEAN NOT NULL DEFAULT false,
    "evidenceURI" TEXT,
    "proposedAt" INTEGER,
    "votesFor" INTEGER NOT NULL DEFAULT 0,
    "votesAgainst" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Milestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Donation" (
    "id" SERIAL NOT NULL,
    "campaignId" INTEGER NOT NULL,
    "donor" TEXT NOT NULL,
    "amountAVAXWei" BIGINT NOT NULL,
    "amountKES" INTEGER NOT NULL,
    "txHash" TEXT NOT NULL,
    "timestamp" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Donation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organiser_walletAddress_key" ON "Organiser"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Campaign_onChainId_key" ON "Campaign"("onChainId");

-- CreateIndex
CREATE UNIQUE INDEX "Milestone_campaignId_index_key" ON "Milestone"("campaignId", "index");

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_organiserId_fkey" FOREIGN KEY ("organiserId") REFERENCES "Organiser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
