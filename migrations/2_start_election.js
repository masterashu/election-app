var Election = artifacts.require("./Election.sol");
const Web3 = require("web3");
const fs = require("fs");

module.exports = function (deployer) {
  const ename = "Election 1";
  const fPubKey = fs.openSync("data/KeyPriv.pem");
  const ePubKey = fs.readFileSync(fPubKey).toString().trimRight();
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
