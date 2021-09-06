// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;
contract Owner{
    address immutable owner;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner {
        require(msg.sender == owner);
        _;
    }    
}

contract Election is Owner {
    // struct Candidate {
    //     bytes32 name;
    //     address id;
    // }

    struct Vote {
        bytes encryptedVoteData;
        bytes32 signature;
        bool voted;
    }

    enum ElectionState { Created, Ready, InProgress, Concluded }

    string name;

    ElectionState public state;

    bytes public publicKey;

    bytes public privateKey;

    address[] public candidates;

    address[] public voters;

    mapping (address => bool) public voterEligiblity;

    mapping (address => Vote) public votes;
    
    // constructor 
    constructor(string memory _name, 
                bytes memory _publicKey,
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
    
    function revealPrivateKey(bytes memory _privateKey) onlyOwner public {
        require(state == ElectionState.Concluded);
        privateKey = _privateKey;
    }
    
    function initiateElection() public onlyOwner {
        require(state == ElectionState.Created);
        state = ElectionState.InProgress;
    }
    
    function concludeElection() public onlyOwner {
        require(state == ElectionState.InProgress);
        state = ElectionState.Concluded;
    }
    
    function castVote(bytes memory voteData, bytes32 signature) public {
        require(voterEligiblity[msg.sender]);
        require(!votes[msg.sender].voted);
        require(state == ElectionState.InProgress);
        
        Vote memory vote = Vote(voteData, signature, true);
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
