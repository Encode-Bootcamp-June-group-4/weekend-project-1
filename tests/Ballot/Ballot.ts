import { expect } from "chai";
import { ethers } from "hardhat";
import { isRegExp } from "util";
// eslint-disable-next-line node/no-missing-import
import { Ballot } from "../../typechain";
import { winningProposal } from "./interfaces";

const PROPOSALS = ["Proposal 1", "Proposal 2", "Proposal 3"];

function convertStringArrayToBytes32(array: string[]) {
  const bytes32Array = [];
  for (let index = 0; index < array.length; index++) {
    bytes32Array.push(ethers.utils.formatBytes32String(array[index]));
  }
  return bytes32Array;
}

async function giveRightToVote(ballotContract: Ballot, voterAddress: any) {
  const tx = await ballotContract.giveRightToVote(voterAddress);
  await tx.wait();
}

/**
 * @dev it will return a random number between 0 and 'numberOfProposals'.
 * @param numberOfProposals is the number of proposals in list
 * @returns a random index of proposal
 */
function giveRandomProposalId(numberOfProposals: number): number {
  return Math.floor(Math.random() * numberOfProposals);
}

describe("Ballot", function () {
  let ballotContract: Ballot;
  let accounts: any[];

  beforeEach(async function () {
    accounts = await ethers.getSigners();
    const ballotFactory = await ethers.getContractFactory("Ballot");
    ballotContract = (await ballotFactory.deploy(
      convertStringArrayToBytes32(PROPOSALS)
    )) as Ballot;
    await ballotContract.deployed();
  });

  describe("when the contract is deployed", function () {
    it("has the provided proposals", async function () {
      for (let index = 0; index < PROPOSALS.length; index++) {
        const proposal = await ballotContract.proposals(index);
        expect(ethers.utils.parseBytes32String(proposal.name)).to.eq(
          PROPOSALS[index]
        );
      }
    });

    it("has zero votes for all proposals", async function () {
      for (let index = 0; index < PROPOSALS.length; index++) {
        const proposal = await ballotContract.proposals(index);
        expect(proposal.voteCount.toNumber()).to.eq(0);
      }
    });

    it("sets the deployer address as chairperson", async function () {
      const chairperson = await ballotContract.chairperson();
      expect(chairperson).to.eq(accounts[0].address);
    });

    it("sets the voting weight for the chairperson as 1", async function () {
      const chairpersonVoter = await ballotContract.voters(accounts[0].address);
      expect(chairpersonVoter.weight.toNumber()).to.eq(1);
    });
  });

  describe("when the chairperson interacts with the giveRightToVote function in the contract", function () {
    it("gives right to vote for another address", async function () {
      const voterAddress = accounts[1].address;
      const tx = await ballotContract.giveRightToVote(voterAddress);
      await tx.wait();
      const voter = await ballotContract.voters(voterAddress);
      expect(voter.weight.toNumber()).to.eq(1);
    });

    it("can not give right to vote for someone that has voted", async function () {
      const voterAddress = accounts[1].address;
      await giveRightToVote(ballotContract, voterAddress);
      await ballotContract.connect(accounts[1]).vote(0);
      await expect(
        giveRightToVote(ballotContract, voterAddress)
      ).to.be.revertedWith("The voter already voted.");
    });

    it("can not give right to vote for someone that already has voting rights", async function () {
      const voterAddress = accounts[1].address;
      await giveRightToVote(ballotContract, voterAddress);
      await expect(
        giveRightToVote(ballotContract, voterAddress)
      ).to.be.revertedWith("");
    });
  });

  describe("when the voter interact with the vote function in the contract", function () {
    let voter: any = null;
    let proposalId = 0;

    beforeEach(async function () {
      voter = accounts[1];
      await giveRightToVote(ballotContract, voter.address); // give rights to vote
      await ballotContract.connect(voter).vote(proposalId); // vote
    });

    it("should allow address with vote right to vote", async function () {
      const voterInfo = await ballotContract.voters(voter.address); // get voter info

      expect(voterInfo.vote).to.be.eq(proposalId); // check if the vote matches the voted proposal
    });

    it("should not allow to vote if the address has already voted", async function () {
      await expect(
        ballotContract.connect(voter).vote(proposalId)
      ).to.be.revertedWith("Already voted.");
    });
  });

  describe("when the voter interact with the delegate function in the contract", function () {
    let voter1: any = null;
    let voter2: any = null;
    let voter3: any = null;

    beforeEach(async () => {
      voter1 = accounts[1];
      voter2 = accounts[2];
      voter3 = accounts[3];

      await Promise.all([
        await giveRightToVote(ballotContract, voter1.address), // give rights to vote,
        await giveRightToVote(ballotContract, voter2.address), // give rights to vote
        await giveRightToVote(ballotContract, voter3.address), // give rights to vote
      ]);
    });

    it("should not allow to delegate if already voted", async function () {
      await ballotContract.connect(voter1).vote(1);

      await expect(
        ballotContract.connect(voter1).delegate(voter1.address)
      ).to.be.revertedWith("You already voted");
    });

    it("should not allow to self-delegate", async function () {
      await expect(
        ballotContract.connect(voter1).delegate(voter1.address)
      ).to.be.revertedWith("Self-delegation is disallowed");
    });

    it("should not allow delegation loop", async function () {
      await ballotContract.connect(voter1).delegate(voter2.address);
      await ballotContract.connect(voter2).delegate(voter3.address);

      await expect(
        ballotContract.connect(voter3).delegate(voter1.address)
      ).to.be.revertedWith("Found loop in delegation");
    });

    it("should not allow to delegate again, if already delegated", async function () {
      await ballotContract.connect(voter3).delegate(voter2.address);

      await expect(
        ballotContract.connect(voter3).delegate(voter1.address)
      ).to.be.revertedWith("");
    });

    it("should not allow to delegate to non voters", async function () {
      let nonVoter = accounts[4].address;

      await expect(
        ballotContract.connect(voter3).delegate(nonVoter)
      ).to.be.revertedWith("");
    });

    it("should add vote weight of to the delegator ", async function () {
      await ballotContract.connect(voter1).delegate(voter2.address);
      const delegatorInfo = await ballotContract.voters(voter2.address);
      expect(delegatorInfo.weight).to.be.equal("2");
    });
  });

  describe("when the an attacker interact with the giveRightToVote function in the contract", function () {
    it("should not allow non chairperson to give voteing rights", async function () {
      const voterAddress = accounts[1].address;
      const attacker = accounts[2];
      await expect(
        ballotContract.connect(attacker).giveRightToVote(voterAddress)
      ).to.be.revertedWith("Only chairperson can give right to vote.");
    });
  });

  describe("when the an attacker interact with the vote function in the contract", function () {
    it("should revert when the address has no right to vote", async function () {
      const attacker = accounts[1];
      await expect(
        ballotContract.connect(attacker).vote("0")
      ).to.be.revertedWith("Has no right to vote");
    });
  });

  describe("when the an attacker interact with the delegate function in the contract", function () {
    let delegator: any = null;
    beforeEach(async function () {
      delegator = accounts[1];
      await giveRightToVote(ballotContract, delegator.address); // give rights to vote,
    });

    it("should not add any weight to the delegator's weight", async function () {
      const attacker = accounts[3];

      await ballotContract.connect(attacker).delegate(delegator.address);

      const delegatorInfo = await ballotContract.voters(delegator.address);
      expect(delegatorInfo.weight).to.be.equal("1");
    });
  });

  describe("when someone interact with the winningProposal function before any votes are cast", function () {
    it("should return zero", async function () {
      const result = await ballotContract.winningProposal();

      expect(result).to.be.eq("0");
    });
  });

  describe("when someone interact with the winningProposal function after one vote is cast for the first proposal", function () {
    const proposalId = "0";
    beforeEach(async function () {
      await ballotContract.vote(proposalId); // vote for first proposal
    });
    it("should return index of first proposal", async function () {
      const actualProposal = await ballotContract.winningProposal();
      expect(actualProposal).to.be.eq(proposalId);
    });
  });

  describe("when someone interact with the winnerName function before any votes are cast", function () {
    it("should return the name of proposal at index 0", async function () {
      // it should return an empty string if there are no votes. But for some reason, it returns the name of the proposal at index 0.
      const results = await ballotContract.winnerName();
      const decodedResults = ethers.utils.parseBytes32String(results); //

      expect(decodedResults).to.be.eq(PROPOSALS[0]);
    });
  });

  describe("when someone interact with the winnerName function after one vote is cast for the first proposal", function () {
    const proposalId = 0;

    beforeEach(async function () {
      await ballotContract.vote(proposalId); // vote for first proposal
    });
    it("should return name of first proposal", async function () {
      const results = await ballotContract.winnerName();

      const decodedResults = ethers.utils.parseBytes32String(results); //

      expect(decodedResults).to.be.eq(PROPOSALS[0]);
    });
  });

  describe("when someone interact with the winningProposal function and winnerName after 5 random votes are cast for the proposals", function () {
    let winningProposalInfo: winningProposal = { name: "", votes: 0, index: 0 };

    beforeEach(async function () {
      const proposalToVotesCount: winningProposal[] = PROPOSALS.map(
        (proposalName, index) => ({
          name: proposalName,
          votes: 0,
          index,
        })
      ); // create an array  to keep track of the actual votes and name Proposal off the chain

      for (let i = 0; i < 5; i++) {
        const voter = accounts[i + 1];
        await giveRightToVote(ballotContract, voter.address);
        const proposalId = giveRandomProposalId(PROPOSALS.length);

        proposalToVotesCount[proposalId].votes += 1;
        await ballotContract.connect(voter).vote(proposalId);
      }
      proposalToVotesCount.sort((a, b) => b.votes - a.votes); // sort the proposals with respect hightest votes

      winningProposalInfo = proposalToVotesCount[0];
    });

    it("should return the highest count of votes on a proposal", async function () {
      const winningProposal = await ballotContract.winningProposal();
      expect(winningProposal).to.be.eq(winningProposalInfo.index);
    });
    it("should return name of the proposal with highest votes count", async function () {
      const results = await ballotContract.winnerName();
      const decodedResults = ethers.utils.parseBytes32String(results);
      expect(decodedResults).to.be.eq(winningProposalInfo.name);
    });
  });
});
