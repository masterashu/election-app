const App = {
  castVoteButton: null,
  enableEthereumButton: null,
  web3Provider: null,
  contracts: {},
  accounts: ['0x0'],
  hasVoted: false,
  voters: [],

  initWeb3: async function () {
    console.log('initWeb3');
    const provider = await detectEthereumProvider();
    if (provider) {
      // From now on, this should always be true:
      App.initContract(provider); // initialize your app
    } else {
      console.log('Please install MetaMask!');
    }
  },

  initContract: async function (provider) {
    console.log('initContract', provider);
    const election = await $.getJSON("Election.json");

    // Instantiate a new truffle contract from the artifact
    App.contracts.Election = TruffleContract(election);

    // Connect provider to interact with contract
    await App.contracts.Election.setProvider(provider);

    // App.listenForEvents();
    return App.render();
  },

  render: async function () {
    console.log('render');
    var electionInstance;

    // Load account data
    // App.account = web3.eth.accounts[0];
    $("#accountAddress").html("Your Account: " + ethereum.selectedAddress);

    // Load Election Details
    App.contracts.Election.deployed().then(async function (instance) {
      instance.name().then((name) => {
        $('#electionName').text(name);
      });

      instance.state().then(function (state) {
        const STATUS = ['Created', 'Ready', 'InProgress', 'Concluded'];
        $('#electionStatus').text(STATUS[state]);
      });

      instance.publicKey().then(function (publicKey) {
        $('#electionPublicKey').text(publicKey);
      });
    });

    // Load List of Voters
    await App.contracts.Election.deployed().then(function (instance) {
      electionInstance = instance;
      return electionInstance.getAllVoters();
    }).then(function (voters) {
      var votersList = $("#voters");
      votersList.empty();
      App.voters = voters;
      $("#showVotesButton").removeAttr('disabled');

      for (var i = 0; i < voters.length; i++) {
        // Render candidate Result
        var voterTemplate = "<li>" + voters[i] + "</li>";
        votersList.append(voterTemplate);
      }
    });

    // Load List of Candidates
    App.contracts.Election.deployed().then(function (instance) {
      electionInstance = instance;
      return electionInstance.getAllCandidates();
    }).then(function (candidates) {
      var candidatesList = $("#candidates");
      candidatesList.empty();

      for (var i = 0; i < candidates.length; i++) {
        // Render candidate Result
        var voterTemplate = `<li><input type="radio" class="candidateOption" id="candidate-${candidates[i]}" name="candidates" value="${candidates[i]}"> <label for="candidate-${candidates[i]}">${candidates[i]}</label><br></li>`;
        candidatesList.append(voterTemplate);
      }

      $('.candidateOption').toArray().forEach(function (e) {
        e.onchange = function () {
          App.castVoteButton.removeAttribute('disabled');
        };
      })
    });
  },

  castVote: function () {
    const selectedCandidate = $('input[name=candidates]:checked').val();
    if (selectedCandidate) {
      App.contracts.Election.deployed().then(function (instance) {
        return instance.castVote(selectedCandidate, { from: App.accounts[0] });
      }).then(function (result) {
        alert('Your vote has been casted.')
      }, function (error) {
        try {
          let msg = error.message.slice(error.message.search("{\"value"), -1);
          let data = JSON.parse(msg).value.data.data;
          let k1 = Object.keys(data).filter((c) => c.startsWith('0x'))[0];
          data = data[k1];
          alert(data.reason)
        } catch (e) {
          console.log(e);
        }
      });
    }
  },

  showVotes: async function () {
    let inst = await App.contracts.Election.deployed();
    var votesList = $("#votes");
    votesList.empty();
    App.voters.forEach(function (voter) {
      inst.votes(voter).then(function (result) {
        votesList.append(`<li> ${voter} : ${(result.voted ? result.encryptedVoteData : 'Not Voted')} </li>`);
      })
    });
  }
};

$(window).load(function () {
  App.ethereumButton = document.getElementById('enableEthereumButton');
  App.ethereumButton.addEventListener('click', async function () {
    //Will Start the metamask extension
    App.accounts = await ethereum.request({ method: 'eth_requestAccounts' });
    ethereum.on('accountsChanged', function (accounts) {
      App.render();
    });
    App.initWeb3();
  });
  App.ethereumButton.toggleAttribute('disabled', false);
  App.castVoteButton = document.getElementById('castVoteButton');
  App.castVoteButton.addEventListener('click', App.castVote);
  App.showVotesButton = document.getElementById('showVotesButton');
  App.showVotesButton.addEventListener('click', App.showVotes);
});
