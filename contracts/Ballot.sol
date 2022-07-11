// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

/// @title Voting contract with delegation
/// @author Manoj M
contract Ballot {
    /// @dev This declares a new struct which includes
    /// the weight of the voter (including the delegated),
    /// whether the voter has voted,
    /// the address to which the voter has delegated his voting power,
    /// and the propsal to which the voter has voted  
    struct Voter {
        uint256 weight; /// weight is accumulated by delegation
        bool voted; /// if true, that person already voted
        address delegate; /// person delegated to
        uint256 vote; /// index of the voted proposal
    }

    /// @dev This declares a new struct which includes
    /// the the name of the proposal
    /// and the total vote count
    struct Proposal {
        bytes32 name; /// short name (up to 32 bytes)
        uint256 voteCount; /// number of accumulated votes
    }

    address public chairperson;

    /// @dev This declares a mapping from an address to the voter struct
    mapping(address => Voter) public voters;

    /// @dev This declares a dynamically-sized array of `Proposal` structs.
    Proposal[] public proposals;

    /// @dev Initialize a new ballot to choose one of `proposalNames`.
    /// @param proposalNames The proposal which needs to be selected
    constructor(bytes32[] memory proposalNames) {
        chairperson = msg.sender;
        voters[chairperson].weight = 1;

        ///@dev For each of the provided proposal names,
        /// create a new proposal object and add it
        /// to the end of the array.
        for (uint256 i = 0; i < proposalNames.length; i++) {
            /// `Proposal({...})` creates a temporary
            /// Proposal object and `proposals.push(...)`
            /// appends it to the end of `proposals`.
            proposals.push(Proposal({name: proposalNames[i], voteCount: 0}));
        }
    }
    /// @return number of proposals
    function proposalLength() public view returns (uint256){
        return proposals.length;
    }

    /// @notice Give voter the right to vote on this ballot
    /// @dev Only the chairperson can give right to vote
    /// @dev The voter should not have voted
    /// @dev It increases the voter weight by 1 
    function giveRightToVote(address voter) external {
        require(
            msg.sender == chairperson,
            "Only chairperson can give right to vote."
        );
        require(!voters[voter].voted, "The voter already voted.");
        require(voters[voter].weight == 0);
        voters[voter].weight = 1;
    }

    /// @dev The function allows the voter to delegate voting rights
    /// @param The address to which the voter has delegated voting rights
    function delegate(address to) external {
        /// assigns reference
        Voter storage sender = voters[msg.sender];
        require(!sender.voted, "You already voted.");

        require(to != msg.sender, "Self-delegation is disallowed.");

        /// Forward the delegation as long as
        /// `to` also delegated.
        /// In general, such loops are very dangerous,
        /// because if they run too long, they might
        /// need more gas than is available in a block.
        /// In this case, the delegation will not be executed,
        /// but in other situations, such loops might
        // cause a contract to get "stuck" completely.
        while (voters[to].delegate != address(0)) {
            to = voters[to].delegate;

            /// We found a loop in the delegation, not allowed.
            require(to != msg.sender, "Found loop in delegation.");
        }

        /// Since `sender` is a reference, this
        /// modifies `voters[msg.sender].voted`
        Voter storage delegate_ = voters[to];

        /// @dev Voters cannot delegate to wallets that cannot vote.
        require(delegate_.weight >= 1);
        sender.voted = true;
        sender.delegate = to;
        if (delegate_.voted) {
            /// If the delegate already voted,
            /// directly add to the number of votes
            proposals[delegate_.vote].voteCount += sender.weight;
        } else {
            /// If the delegate did not vote yet,
            /// add to her weight.
            delegate_.weight += sender.weight;
        }
    }
    /// @dev The vote function allows the voter for the proposal
    /// @dev It increases the proposal votecount by the weight including the delegated weoght 
    /// @param The index of the proposal
    function vote(uint256 proposal) external {
        Voter storage sender = voters[msg.sender];
        require(sender.weight != 0, "Has no right to vote");
        require(!sender.voted, "Already voted.");
        sender.voted = true;
        sender.vote = proposal;

        /// If `proposal` is out of the range of the array,
        /// this will throw automatically and revert all
        /// changes.
        proposals[proposal].voteCount += sender.weight;
    }
    /// @return The winning rpoposal index
    function winningProposal() public view returns (uint256 winningProposal_) {
        uint256 winningVoteCount = 0;
        for (uint256 p = 0; p < proposals.length; p++) {
            if (proposals[p].voteCount > winningVoteCount) {
                winningVoteCount = proposals[p].voteCount;
                winningProposal_ = p;
            }
        }
    }

    /// @dev Calls winningProposal() function to get the index
    /// of the winner contained in the proposals array and then
    /// returns the name of the winner
    /// @return winning proposal name
    function winnerName() external view returns (bytes32 winnerName_) {
        winnerName_ = proposals[winningProposal()].name;
    }
}
