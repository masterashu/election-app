var Election = artifacts.require("./Election.sol");
const Web3 = require("web3");
const fs = require("fs");

module.exports = function (deployer) {
  const ename = "Election";
  const ePubKey = Web3.utils.hexToBytes("0x01234567890");
  const voters = [];
  const voterData = fs.openSync("data/voters.txt");
  fs.readFileSync(voterData).toString().split("\n").forEach((line) => {
    if (line.length == 0) return;
    voters.push(line.trim());
  });
  const candidates = [];
  const candidateData = fs.openSync("data/candidates.txt");
  fs.readFileSync(candidateData).toString().split("\n").forEach((line) => {
    if (line.length == 0) return;
    candidates.push(line.trim());
  });
  deployer.deploy(Election, ename, ePubKey, voters, candidates);
};
