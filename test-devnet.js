const { Connection, Keypair, LAMPORTS_PER_SOL, clusterApiUrl } = require('@solana/web3.js');
const { createMint, getOrCreateAssociatedTokenAccount, mintTo } = require('@solana/spl-token');

async function main() {
    console.log('🚀 Connecting to Solana Devnet...');
    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

    // 1. Generate a test creator keypair
    const creator = Keypair.generate();
    console.log(`🔑 Generated Test Creator Wallet: ${creator.publicKey.toBase58()}`);

    // 2. Request Airdrop of 1 SOL on Devnet
    console.log('💧 Requesting 1.0 Devnet SOL airdrop from Solana faucet...');
    try {
        const airdropSig = await connection.requestAirdrop(creator.publicKey, 1 * LAMPORTS_PER_SOL);
        const latestBlockhash = await connection.getLatestBlockhash();
        await connection.confirmTransaction({
            blockhash: latestBlockhash.blockhash,
            lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
            signature: airdropSig
        });
        console.log(`✅ Airdrop confirmed! Signature: https://solscan.io/tx/${airdropSig}?cluster=devnet`);
    } catch (err) {
        console.log(`⚠️ Faucet rate limit, checking balance or proceeding: ${err.message}`);
    }

    const balance = await connection.getBalance(creator.publicKey);
    console.log(`💰 Live Devnet Balance: ${balance / LAMPORTS_PER_SOL} SOL`);

    if (balance > 0) {
        // 3. Deploy real SPL Token Mint on Devnet
        console.log('⚙️ Creating SPL Token Mint on Solana Devnet...');
        const mint = await createMint(
            connection,
            creator,
            creator.publicKey,
            creator.publicKey,
            9 // 9 decimals
        );
        console.log(`🎉 SPL Token Mint Created: ${mint.toBase58()}`);
        console.log(`🔗 View Token on Solscan: https://solscan.io/token/${mint.toBase58()}?cluster=devnet`);

        // 4. Create Associated Token Account & Mint Initial Supply
        const tokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            creator,
            mint,
            creator.publicKey
        );
        console.log(`📦 Associated Token Account: ${tokenAccount.address.toBase58()}`);

        const initialSupply = 1_000_000_000 * 10 ** 9; // 1 Billion tokens
        console.log('🪙 Minting 1,000,000,000 $INFLUENT Agent Tokens to Creator...');
        const mintTx = await mintTo(
            connection,
            creator,
            mint,
            tokenAccount.address,
            creator.publicKey,
            initialSupply
        );
        console.log(`✅ Tokens Minted! Tx: https://solscan.io/tx/${mintTx}?cluster=devnet`);
        console.log('\n========================================');
        console.log('🎯 DEVNET DEPLOYMENT TEST: 100% SUCCESS!');
        console.log('========================================\n');
    } else {
        console.log('ℹ️ Devnet public faucet is rate-limited on standard endpoint. You can claim Devnet SOL via faucet.solana.com or web wallet.');
    }
}

main().catch(console.error);
