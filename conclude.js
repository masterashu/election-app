const fs = require('fs')
async function conclude(Election){
    const e = await Election.deployed()
    const f = fs.openSync('data/KeyPriv.pem');
    const s = fs.readFileSync(f).toString();
    await e.revealPrivateKey(s);
    await e.concludeElection();
}

module.exports = conclude;
