import { generateWallet, getStxAddress } from '@stacks/wallet-sdk'

export async function loadSignerWallet() {
  const mnemonic = process.env.STACKS_MNEMONIC?.trim()
  const privateKey = process.env.STACKS_PRIVATE_KEY?.trim()

  if (!mnemonic && !privateKey) {
    throw new Error('Set STACKS_MNEMONIC or STACKS_PRIVATE_KEY in backend/.env')
  }

  const wallet = mnemonic
    ? await generateWallet({ secretKey: mnemonic, password: '' })
    : { accounts: [{ stxPrivateKey: privateKey }] }

  const account = wallet.accounts[0]
  const senderKey = account.stxPrivateKey
  const address = getStxAddress({ account, network: 'testnet' })

  return { senderKey, address, account }
}
