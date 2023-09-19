import React, {useEffect, useState} from "react";
import {ethers} from "ethers";
import './styles/App.css';

import ethLogo from './assets/ethlogo.png';
import twitterLogo from './assets/twitter-logo.svg';
import githubLogo from './assets/github-logo.svg';
import telegramLogo from './assets/telegram-logo.svg';
import bridge from './utils/Bridge.json';
import money from './assets/money.gif';
import homer from './assets/Homer.gif';
import bridgeGif from './assets/bridge.gif';
import {networks, networksLZ} from './utils/networks';

const TWITTER_LINK = `https://twitter.com/Bridge_LZ`;
const GITHUB_LINK = `https://github.com/bridge-lz`;
const TELEGRAM_LINK = `https://t.me/+RlDq3qM8AnIzZjhk`;
const CONTRACT_ADDRESS = '0x233dc79F924c35AcB4524BaC4A883c8CE11A75B2';
let chainId = '';


const App = () => {
    const [currentAccount, setCurrentAccount] = useState("");
    const [network, setNetwork] = useState('');
    const [nbTokenCreate, setNbTokenCreate] = useState('');
    const [nbTokenBurn, setNbTokenBurn] = useState('');
    const [nbTokenTransfer, setNbTokenTransfer] = useState('');
    const [selectNetwork, setSelectNetwork] = useState('');
    const [balanceOfToken, setBalanceOfToken] = useState('');
    const [mintFee, setMintFee] = useState('');
    const handleChange = (e) => {
        setSelectNetwork(e.target.value);
    };
    /**
     * Implement your connectWallet method here
     */
    const connectWallet = async () => {
        try {
            const {ethereum} = window;

            console.log(ethereum)

            if (!ethereum) {
                alert("Get a wallet !");
                return;
            }
            const accounts = await ethereum.request({method: "eth_requestAccounts"});
            setCurrentAccount(accounts[0]);
        } catch (error) {
            console.log(error)
        }
    }
    /*
        Check if a wallet is connected
      */
    const checkIfWalletIsConnected = async () => {
        try {
            const {ethereum} = window;

            if (!ethereum) {
                console.log("Make sure you have metamask!");
                return;
            } else {
                console.log("We have the ethereum object", ethereum);
            }

            const accounts = await ethereum.request({method: "eth_accounts"});

            if (accounts.length !== 0) {
                const account = accounts[0];
                console.log("Found an authorized account:", account);
                setCurrentAccount(account);

                // Get actual balance of $BRIDGE on this network
                const provider = new ethers.providers.Web3Provider(ethereum);
                const signer = provider.getSigner();
                const contract = new ethers.Contract(CONTRACT_ADDRESS, bridge, signer);
                const balanceOf = await contract.balanceOf(ethers.utils.getAddress(account));
                setBalanceOfToken(ethers.utils.formatEther(balanceOf).toString());

                // Get actual mint fee on this network
                const resultFee = await contract.feeForOwner();
                setMintFee((resultFee / 100).toString());

            } else {
                console.log("No authorized account found")
            }

            chainId = await ethereum.request({method: 'eth_chainId'});
            setNetwork(networks[chainId]);

            ethereum.on('chainChanged', handleChainChanged);

            // Reload the page when they change networks
            function handleChainChanged(_chainId) {
                window.location.reload();
            }
        } catch (error) {
            console.log(error);
        }
    }

    const createToken = async () => {
        // Alert the user if the domain is too short
        console.log("Minting token");
        const {ethereum} = window;
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, bridge, signer);
        try {
            if (ethereum) {
                let tokenToCreate = ethers.utils.parseEther(nbTokenCreate);
                let tx = await contract.createToken({value: tokenToCreate});
                // Wait for the transaction to be mined
                const receipt = await tx.wait();
                setNbTokenCreate('');
                // Check if the transaction was successfully completed
                if (!receipt.status === 1) {
                    alert("Transaction failed! Please try again");
                }
            }
        } catch (error) {
            if (error.code === "INSUFFICIENT_FUNDS") {
                alert("Insufficient funds");
            }
        }
    }

    const burnToken = async () => {
        // Alert the user if the domain is too short
        console.log("Burning token");
        const {ethereum} = window;
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, bridge, signer);
        try {
            if (ethereum) {
                let tokenToBurn = ethers.utils.parseEther(nbTokenBurn);
                let tx = await contract.burnToken(tokenToBurn.toString());
                // Wait for the transaction to be mined
                const receipt = await tx.wait();
                setNbTokenBurn('');
                // Check if the transaction was successfully completed
                if (!receipt.status === 1) {
                    alert("Transaction failed! Please try again");
                }
            }
        } catch (error) {
            if (error.code === "UNPREDICTABLE_GAS_LIMIT") {
                alert("Please enter a valid number");
            }
        }
    }

    const transferToken = async () => {
        // Alert the user if the domain is too short
        console.log("Transfer token");
        const {ethereum} = window;
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, bridge, signer);

        try {
            if (ethereum) {
                const resultFee = await contract.estimateSendFee(
                    networksLZ[selectNetwork], // dstChainId
                    ethers.utils.defaultAbiCoder.encode(["address"], [currentAccount]), // toAddress
                    ethers.utils.parseEther(nbTokenTransfer).toString(), // amount
                    false, // useZro
                    "0x", // adapterParams
                    {value: ethers.utils.parseEther("0")} // value
                );

                let tx = await contract.sendFrom(
                    currentAccount,
                    networksLZ[selectNetwork],
                    ethers.utils.defaultAbiCoder.encode(["address"], [currentAccount]),
                    ethers.utils.parseEther(nbTokenTransfer).toString(),
                    [
                        currentAccount,
                        "0x000000000000000000000000000000000000dEaD",
                        "0x"
                    ],
                    {value: resultFee.nativeFee}
                );

                // Wait for the transaction to be mined
                const receipt = await tx.wait();
                // Check if the transaction was successfully completed
                if (!receipt.status === 1) {
                    alert("Transaction failed! Please try again");
                }
            }
        } catch (error) {
            if (error.code === "UNPREDICTABLE_GAS_LIMIT") {
                alert("Please enter a valid number");
            }
        }
    }

    // Create a function to render if wallet is not connected yet
    const renderNotConnectedContainer = () => (
        <div className="connect-wallet-container">
            <button className="cta-button connect-wallet-button" onClick={connectWallet}>
                Connect Wallet
            </button>
        </div>
    );


    // Form to enter domain name and data
    const renderInputCreateToken = () => {
        return (
            <div className="form-container">
                <div>
                    <h3>⛏️ Create new $BRIDGE (1:1 with gas chain less {mintFee}% fee on this network)</h3>
                </div>
                <div className="first-row">
                    <input
                        id="nbTokenCreate"
                        type="number"
                        value={nbTokenCreate}
                        placeholder='Amount of $BRIDGE to mint'
                        onChange={e => setNbTokenCreate(e.target.value)}
                    />
                    <p></p>
                    {(network !== undefined) && (
                        <button className='cta-button mint-button' onClick={createToken}>
                            Mint
                        </button>
                    )}
                </div>
            </div>
        );
    }
    // Form to burn $BRIDGE and get gas chain back
    const renderInputBurnToken = () => {
        return (
            <div className="form-container">
                <div>
                    <h3>🔥 Burn $BRIDGE (1:1 with gas chain back)</h3>
                </div>
                <div className="first-row">
                    <input
                        id="nbTokenBurn"
                        type="number"
                        value={nbTokenBurn}
                        placeholder='Amount of $BRIDGE to burn'
                        onChange={e => setNbTokenBurn(e.target.value)}
                    />
                    {(network !== undefined) && (
                        <button className='cta-button mint-button' onClick={burnToken}>
                            Burn
                        </button>
                    )}
                </div>
            </div>
        );
    }
    // Form to transfer $BRIDGE to another chain
    const renderTransferToken = () => {
        return (

            <div className="form-container">
                <div>
                    <h2>📤 Transfer $BRIDGE</h2>
                </div>
                <div className="first-row">
                    <select value={selectNetwork} required={true}
                            onChange={handleChange}>
                        <option defaultValue="true" disabled="disabled" value="">Select a network</option>
                        {Reflect.deleteProperty(networks, chainId)}
                        {
                            Object.entries(networks).map(([k, v]) => (
                                <option key={k} value={k}>
                                    {v}
                                </option>
                            ))
                        }
                    </select>
                </div>
                <div className="first-row">
                    <input
                        required={true}
                        id="nbTokenTransfer"
                        type="number"
                        value={nbTokenTransfer}
                        placeholder='Amount of $BRIDGE to move'
                        onChange={e => setNbTokenTransfer(e.target.value)}
                    />
                    {(network !== undefined) && (
                        <button className='cta-button other-button' onClick={() => {
                            setNbTokenTransfer(balanceOfToken)
                        }}>
                            Max $BRIDGE
                        </button>
                    )}
                    {(network !== undefined) && (
                        <button className='cta-button mint-button' onClick={transferToken}>
                            Transfer
                        </button>
                    )}
                </div>
            </div>
        );
    }

    useEffect(() => {
        checkIfWalletIsConnected();
    }, []);
    return (
        <div className="App">
            <div className="container">

                <div className="header-container">
                    <header>
                        <div className="left">
                            <p className="title">🌉 $BRIDGE</p>
                            <p className="subtitle">The first shitcoin <small>(with utility)</small> omnichain !</p>
                        </div>

                        <div className="right">
                            {network !== undefined ? (
                                <div className="right">
                                    <img alt="Network logo" className="logo" src={ethLogo}/>
                                    <p> {network} </p>
                                </div>
                            ) : (<p style={{marginRight: 10 + '%'}}> ⚠️ Network not supported </p>)}
                            {currentAccount ?
                                <p> Wallet: {currentAccount.slice(0, 6)}...{currentAccount.slice(-4)} <br/> Balance of
                                    $BRIDGE <small>on this network</small> : {balanceOfToken > 0 ? balanceOfToken : 0}</p> :
                                <p> Not connected </p>}
                        </div>
                    </header>
                </div>
                <div>
                    <div className="topnav">
                        <a href="#whatis">⁉️ What is $BRIDGE ?</a>
                        <a href="#interact">🧑‍🌾 Interact with $BRIDGE</a>
                        <a href="#more">ℹ️ More on $BRIDGE</a>
                    </div>
                </div>

                <div className="explanation-container">
                    <img src={bridgeGif}/>
                    <h2 id="whatis">⁉️ What is $BRIDGE ?</h2>
                    <p>
                        $BRIDGE is the first shitcoin omnichain with utility, thanks to OFT LayerZero tech !
                        <br/>
                        <br/>
                        $BRIDGE is a token that can be minted 1:1 with gas chain (less fee).
                        <br/>
                        <br/>
                        $BRIDGE is a token that can be move to any supported chain.
                        <br/>
                        <br/>
                        $BRIDGE is a token that can be burned 1:1 with gas chain (back).
                        <br/>
                        <br/>
                    </p>
                </div>
                <div className="form-container">
                    <h2 id="interact">🧑‍🌾 Interact with $BRIDGE</h2>
                </div>
                {!currentAccount && renderNotConnectedContainer()}
                {currentAccount && renderInputCreateToken()}
                {currentAccount && renderInputBurnToken()}
                {currentAccount && renderTransferToken()}

                <div className="explanation-container">
                    <h2 id="more">ℹ️ More on this $BRIDGE :</h2>
                    <img src={money}/>
                    <h3> Where to buy :</h3>
                    <p>
                        🔵 $BRIDGE / $ETH on BaseSwap : <a
                        href="https://baseswap.fi/swap?outputCurrency=0x233dc79f924c35acb4524bac4a883c8ce11a75b2"
                        rel="noreferrer" target="_blank">https://baseswap.fi/swap</a>
                        <br/>
                        🔴 $BRIDGE / $ETH on Velodrome : <a
                        href="https://app.velodrome.finance/swap?from=eth&to=0x233dc79f924c35acb4524bac4a883c8ce11a75b22"
                        rel="noreferrer" target="_blank">https://app.velodrome.finance/swap</a>
                        <br/>
                        🔵 $BRIDGE / $BRIDGE FriendTech Shares : <a
                        href="https://baseswap.fi/swap?outputCurrency=0x233dc79f924c35acb4524bac4a883c8ce11a75b2"
                        rel="noreferrer" target="_blank">https://baseswap.fi/swap</a>
                        <br/>
                    </p>
                    <img src={homer}/>
                    <h3>Contract address :</h3>
                    <p>
                        <ul>
                            <li>Ethereum : <a
                                href="https://etherscan.io/address/0x233dc79F924c35AcB4524BaC4A883c8CE11A75B2"
                                target="_blank">0x233dc79F924c35AcB4524BaC4A883c8CE11A75B2</a></li>

                            <li>Base : <a
                                href=" https://basescan.org/address/0x233dc79F924c35AcB4524BaC4A883c8CE11A75B2"
                                target="_blank">0x233dc79F924c35AcB4524BaC4A883c8CE11A75B2</a></li>
                            <li> Linea : <a
                                href="https://lineascan.build/address/0x233dc79F924c35AcB4524BaC4A883c8CE11A75B2"
                                target="_blank">0x233dc79F924c35AcB4524BaC4A883c8CE11A75B2</a></li>
                            <li>Optimism : <a
                                href="https://optimistic.etherscan.io/address/0x233dc79F924c35AcB4524BaC4A883c8CE11A75B2"
                                target="_blank">0x233dc79F924c35AcB4524BaC4A883c8CE11A75B2</a></li>
                        </ul>
                    </p>
                </div>
                <div className="footer-container">
                    <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo}/>
                    <a
                        className="footer-text"
                        href={TWITTER_LINK}
                        target="_blank"
                        rel="noreferrer"
                    >@Bridge_LZ</a>
                    <img alt="Github Logo" className="twitter-logo" src={githubLogo}/>
                    <a
                        className="footer-text"
                        href={GITHUB_LINK}
                        target="_blank"
                        rel="noreferrer"
                    >Bridge-LZ</a>
                    <img alt="Telegram Logo" className="twitter-logo" src={telegramLogo}/>
                    <a
                        className="footer-text"
                        href={TELEGRAM_LINK}
                        target="_blank"
                        rel="noreferrer"
                    >Bridge-LZ</a>
                </div>
            </div>
        </div>
    );
}

export default App;
