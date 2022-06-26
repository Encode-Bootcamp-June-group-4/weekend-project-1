# Weekend Project #1

- Structure scripts to
  - Deploy
  - Query proposals
  - Give vote right passing an address as input
  - Cast a vote to a ballot passing contract address and proposal as input and using the wallet in environment
  - Delegate my vote passing user address as input and using the wallet in environment
  - Query voting result and print to console
- Publish the project in Github
- Run the scripts with a set of proposals, cast and delegate votes and inspect results
- Write a report detailing the addresses, transaction hashes, description of the operation script being executed and console output from script execution for each step (Deployment, giving voting rights, casting/delegating and querying results).
- (Extra) Use TDD methodology

# Report

### Step 1 Deploy Contract

- Make a contract with proposals as parameters in our case the parameters are ("Chips","Drinks","Chocolates")
- To run script `yarn ts-node ./scripts/Ballot/deployment.ts Chips Drinks Chocolates`
- Which gives us a contract Address <a href="https://ropsten.etherscan.io/address/0x2ACdF691c1F6F279654a2F61256B6864a70553Be" target="_blank">0x2ACdF691c1F6F279654a2F61256B6864a70553Be</a>

### Step 2 Query Proposal

- Query the proposals from the script `yarn ts-node ./scripts/Ballot/queryProposal.ts 0x2ACdF691c1F6F279654a2F61256B6864a70553Be` with the contract address above

### Step 3 Give right to vote

- `giveVotingRights.ts` takes two parameters the contract address and the address who should be given the right to vote
- Address that has been given right to vote `0xB449699491DeE144982551aCC64999514c3C2871` and the contract address is `0x2ACdF691c1F6F279654a2F61256B6864a70553Be`
- The command for running the operation `yarn ts-node ./scripts/Ballot/giveVotingRights.ts 0x2ACdF691c1F6F279654a2F61256B6864a70553Be 0xB449699491DeE144982551aCC64999514c3C2871`
- Transaction hash for this operation <a href="https://ropsten.etherscan.io/tx/0x06b235e0fb96c908bf322ed8b8dc61a206e8cf0b891629c7b4b3bd8ec4624fd8" target="_blank">0x06b235e0fb96c908bf322ed8b8dc61a206e8cf0b891629c7b4b3bd8ec4624fd8</a>

### Step 4 Cast a vote

- Cast a vote which can be the person who has made the contract or from another wallet which should initate the contract
- The parameters are the contract address and index of the proposal when making the contract
- The command for running the script is `yarn ts-node ./scripts/Ballot/castVote.ts 0x2ACdF691c1F6F279654a2F61256B6864a70553Be 1`
- The Transaction hash is <a href="https://ropsten.etherscan.io/tx/0x5e2e064fcbc9da5103917551f805f69ba9b1cadc1f51831173a4187e037b8a4b" target="_blank">0x5e2e064fcbc9da5103917551f805f69ba9b1cadc1f51831173a4187e037b8a4b</a>

### Step 5 Delegate the vote

- In order for delegate vote properly the person the vote has been delegated must get right to vote first
- The parameters required are the contract address and the address of the person delegated to

- The command for running the script is `yarn ts-node ./scripts/Ballot/delegate.ts 0x2ACdF691c1F6F279654a2F61256B6864a70553Be 0x13a75eC383eF0a83DC0A4d48d3475c73edd473E8`

- The transaction hash is <a href="https://ropsten.etherscan.io/tx/0xef023a0acec7eb60bc7423b631e191fc6c7f948314aeab4f35cc780cb67ac8df" target="_blank">0xef023a0acec7eb60bc7423b631e191fc6c7f948314aeab4f35cc780cb67ac8df</a>

Please note that the chair person can not delegate his vote

### Step 6 Query voting results

- The command for running winning proposal is `yarn ts-node ./scripts/Ballot/winningProposal.ts 0x2ACdF691c1F6F279654a2F61256B6864a70553Be`

### Conclusion what did we build

We worked on making a decentralized voting application that has different features such as making a contract, delegating a vote, making proposals, voting on those proposals and finding the winning proposals.
