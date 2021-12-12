// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;
contract Owner{
    address immutable owner;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner {
        require(msg.sender == owner, "This function is restricted to the contract's owner");
        _;
    }    
}

contract Election is Owner {
    // struct Candidate {
    //     bytes32 name;
    //     address id;
    // }

    struct Vote {
        string encryptedVoteData;
        bool voted;
    }

    enum ElectionState { Created, VotingInProgress, VotingConcluded, ResultsDeclared }

    string public name;

    ElectionState public state;

    string public publicKey;

    string public privateKey;

    address[] public candidates;

    address[] public voters;

    mapping (address => bool) public voterEligiblity;

    mapping (address => Vote) public votes;
    
    // constructor 
    constructor(string memory _name, 
                string memory _publicKey,
                address[] memory _voters, 
                address[] memory _candidates) {
        name = _name;
        voters = _voters;
        publicKey = _publicKey;
        candidates = _candidates;
        for(uint i = 0; i < _voters.length; i++){
            voterEligiblity[_voters[i]] = true;
        }
    }
    
    function revealPrivateKey(string calldata _privateKey) onlyOwner public {
        require(state == ElectionState.VotingConcluded, "The Election has not been concluded. Conclude the Election first to reveal the Private Key.");
        privateKey = _privateKey;
    }
    
    function initiateElection() public onlyOwner {
        require(state == ElectionState.Created, "You cannot Initiate the Election at this point");
        state = ElectionState.VotingInProgress;
    }

    function concludeVoting() public onlyOwner {
        require(state == ElectionState.VotingInProgress, "The Election is currently not in Progress.");
        state = ElectionState.VotingConcluded;
    }
    
    function concludeElection() public onlyOwner {
        require(state == ElectionState.VotingConcluded, "The Voting is currently not concluded");
        state = ElectionState.ResultsDeclared;
    }
    
    function castVote(string calldata voteData) public {
        // require(!votes[msg.sender].voted, "You have already voted for this election.");
        require(voterEligiblity[msg.sender], "You are not eligible to vote for this election.");
        require(state == ElectionState.VotingInProgress, "The Election is concluded or have not been started yet.");
        
        Vote memory vote = Vote(voteData, true);
        voterEligiblity[msg.sender] = false;
        votes[msg.sender] = vote;
    }
    
    function getVoteData(address voter) public view returns (Vote memory) {
         return votes[voter];
    }

    function getAllVoters() public view returns (address[] memory) {
        address[] memory result = new address[](voters.length);
        for(uint i = 0; i < voters.length; i++){
            result[i] = voters[i];
        }
        return result;
    }

    function getAllCandidates() public view returns (address[] memory) {
        address[] memory result = new address[](candidates.length);
        for(uint i = 0; i < candidates.length; i++){
            result[i] = candidates[i];
        }
        return result;
    }
}
