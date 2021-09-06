const App = {
  web3Provider: null,
  contracts: {},
  accounts: ['0x0'],
  hasVoted: false,

  init: function () {
    console.log('init');
    // return App.initWeb3();
  },

  initWeb3: async function () {
    console.log('initWeb3');
    // window.addEventListener('load', async () => {
    // Wait for loading completion to avoid race conditions with web3 injection timing.
    if (window.ethereum) {
      const web3 = new Web3(window.ethereum);
      try {
        // Request account access if needed
        await window.ethereum.enable();
        // Acccounts now exposed
        return App.initContract(web3);
      } catch (error) {
        console.error(error);
      }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      // Use Mist/MetaMask's provider.
      const web3 = window.web3;
      console.log('Injected web3 detected.');
      return App.initContract(web3);
    }
    // Fallback to localhost; use dev console port by default...
    else {
      const provider = new Web3.providers.HttpProvider('http://127.0.0.1:7545');
      const web3 = new Web3(provider);
      console.log('No web3 instance injected, using Local web3.');
      return App.initContract(web3);
    }
    // });
  },

  initContract: async function (web3) {
    console.log('initContract', web3);
    const election = await $.getJSON("Election.json");
    console.log(election);
    // Instantiate a new truffle contract from the artifact
    App.contracts.Election = TruffleContract(election);
    // Connect provider to interact with contract
    await App.contracts.Election.setProvider(web3.givenProvider);

    // App.listenForEvents();
    return App.render();
  },

  render: function () {
    console.log('render');
    var electionInstance;

    // Load account data
    // App.account = web3.eth.accounts[0];
    $("#accountAddress").html("Your Account: " + App.accounts[0]);


    // Load contract data
    App.contracts.Election.deployed().then(function (instance) {
      electionInstance = instance;
      return electionInstance.getAllVoters();
    }).then(function (voters) {
      var votersList = $("#voters");
      votersList.empty();

      for (var i = 0; i < voters.length; i++) {
        // Render candidate Result
        var voterTemplate = "<li>" + voters[i] + "</li>";
        votersList.append(voterTemplate);
      }
    });
    App.contracts.Election.deployed().then(function (instance) {
      electionInstance = instance;
      return electionInstance.getAllCandidates();
    }).then(function (candidates) {
      var candidatesList = $("#candidates");
      candidatesList.empty();

      for (var i = 0; i < candidates.length; i++) {
        // Render candidate Result
        var voterTemplate = "<li>" + candidates[i] + "</li>";
        candidatesList.append(voterTemplate);
      }
    });
  }
};

$(function () {
  $(window).load(function () {
    App.init();
  });
});
