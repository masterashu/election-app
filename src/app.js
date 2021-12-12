const App = {
  castVoteButton: null,
  enableEthereumButton: null,
  stateEnum: 0,
  web3Provider: null,
  contracts: {},
  accounts: ['0x0'],
  hasVoted: false,
  voters: [],
  electionPublicKey: null,
  electionPrivateKey: null,

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
        const STATUS = ['Created', 'VotingInProgress', 'VotingConcluded', 'ResultsDeclared'];
        App.stateEnum = state;
        $('#electionStatus').text(STATUS[state]);
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

  castVote: async function () {
    const selectedCandidate = $('input[name=candidates]:checked').val();
    if (selectedCandidate) {
      let privateKey = await App.getElectionPrivateKey();
      if (!privateKey) {
        alert("You didn't select a Private Key")
        return;
      }
      let encryptedVote;
      try {
        encryptedVote = await App.encryptVote(selectedCandidate, privateKey);
      } catch {
        alert("You have selected an invalid Private Key")
        return;
      }
      App.contracts.Election.deployed().then(function (instance) {
        return instance.castVote(encryptedVote, { from: App.accounts[0] });
      }).then(function (result) {
        alert('Your vote has been casted.')
      }, function (error) {
        console.log(error.message);
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

  getUserKey: function () {
    return new Promise(async (resolve, reject) => {
      let input = $(document.createElement('input'));
      input.attr("type", "file");
      input.attr("accept", ".pem")
      input.on('change', async function (e) {
        if (e.target.files?.length ?? 0 > 0) {
          resolve(await e.target.files[0].text());
        } else {
          reject("No File Selected");
        }
        input.off();
      });
      input.trigger('click');
    });
  },

  getElectionPublicKey: async function () {
    let e = await App.contracts.Election.deployed();
    return await e.publicKey();
  },

  getElectionPrivateKey: async function () {
    let e = await App.contracts.Election.deployed();
    return await e.publicKey();
  },

  encryptVote: function (voteData, privateKey) {
    const crypt = new JSEncrypt();
    crypt.setPrivateKey(privateKey)
    const encryptedVote = crypt.encrypt(voteData);
    if (encryptedVote) {
      return encryptedVote;
    } else {
      return null;
    }
  },

  decryptVote: async function (voter, encryptedVoteData) {
    if (!encryptedVoteData) {
      return null;
    }
    let publicKey = await App.getElectionPublicKey();
    if (!publicKey) {
      alert("The Election Key hasn't been published yet.");
      return null;
    }
    const crypt = new JSEncrypt();
    crypt.setPrivateKey(publicKey);
    console.log(`deconding vote ${encryptedVoteData} of ${voter} using`);
    console.log(publicKey);
    const decryptedVote = crypt.decrypt(encryptedVoteData);
    return decryptedVote;
  },

  showVotes: async function () {
    let inst = await App.contracts.Election.deployed();
    var votesList = $("#votes");
    votesList.empty();
    App.voters.forEach(function (voter) {
      inst.votes(voter).then(function (result) {
        votesList.append(`<li id="vote-${voter}"> ${voter} : ${(result.voted ? result.encryptedVoteData : 'Not Voted')} </li>`);
        if (!result.voted) {
          return;
        }
        const decryptButton = document.createElement('button');
        decryptButton.append('Decode Vote')
        decryptButton.addEventListener('click', async function () {
          if (App.stateEnum < 3) {
            alert("The election is still in progress.");
            return;
          }
          let decryptedVote = await App.decryptVote(voter, result.encryptedVoteData);
          alert(decryptedVote);
        });
        votesList.append(decryptButton)
      })
    });
  },

  generateEthereumAccount: function () {
    const web3 = new Web3();
    const newAccount = web3.eth.accounts.create();
    $('#ethereumPublicKey').val(newAccount.address);
    $('#ethereumPrivateKey').val(newAccount.privateKey);
  },

  generateRsaKeyPair: function () {
    const keySize = 1024;
    const crypt = new JSEncrypt({ default_key_size: keySize });
    crypt.getKey();
    $('#rsaPrivateKey').val(crypt.getPrivateKey());
    // $('#rsaPublicKey').val(crypt.getPublicKey());
  },

  revealPublicKey: async function () {
    let e = await App.contracts.Election.deployed();
    let publicKey = await App.getUserKey();
    await e.revealPublicKey(publicKey, { from: App.accounts[0] }).then(
      function () {
        alert("Your Public Key has been Published");
      },
      function (error) {
        console.log(error.message);
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
  },
};

function download(content, filename, contentType) {
  if (!contentType) contentType = 'application/octet-stream';
  var a = document.createElement('a');
  var blob = new Blob([content], { 'type': contentType });
  a.href = window.URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}


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

  document.getElementById('newAccount').addEventListener('click', App.generateEthereumAccount);
  document.getElementById('newRsaPair').addEventListener('click', App.generateRsaKeyPair);

  document.getElementById('dlRsaPrivateKey').addEventListener('click', () => {
    download($('#rsaPrivateKey').val(), 'rsaPrivateKey.pem')
  });
  // document.getElementById('dlRsaPublicKey').addEventListener('click', () => {
  //   download($('#rsaPublicKey').val(), 'rsaPublicKey.pem')
  // });

  document.getElementById('dlEthPrivateKey').addEventListener('click', () => {
    download($('#ethereumPrivateKey').val(), 'ethereumPrivateKey.pem');
  });
  document.getElementById('dlEthPublicKey').addEventListener('click', () => {
    download($('#ethereumPublicKey').val(), 'ethereumPublicKey.pem');
  });
  document.getElementById('revealPublicKey').addEventListener('click', App.revealPublicKey);
});
