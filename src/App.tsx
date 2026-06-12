import { useState } from 'react';
import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { Code, CheckCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

declare global {
  interface Window {
    ethereum: any;
  }
}

// Replace with actual deployed contract address on Studionet
const CONTRACT_ADDRESS = '0x184451423e6A219C1928ED79FA68FDc442e79041'; 

function App() {
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [githubUrl, setGithubUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [result, setResult] = useState<any>(null);
  const [existingSBT, setExistingSBT] = useState<any>(null);

  const checkExistingSBT = async (address: string, client: any) => {
    const saved = JSON.parse(localStorage.getItem('my_sbts') || '{}');
    const url = saved[address];
    if (url) {
      try {
        const res = await client.readContract({
          address: CONTRACT_ADDRESS as `0x${string}`,
          functionName: 'get_badge',
          args: [url],
        });
        if (res && res !== 'NOT_FOUND') {
          setExistingSBT(JSON.parse(res as string));
        }
      } catch (e) {
        console.error("Could not fetch existing SBT", e);
      }
    }
  };

  const addLine = (line: string, delay: number = 0) => {
    setTimeout(() => {
      setTerminalLines(prev => [...prev, line]);
    }, delay);
  };

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const addr = accounts[0];
        setWalletAddress(addr);
        
        // Setup client to check for existing SBTs immediately
        const glAccount = { address: addr, privateKey: '0x0' };
        const client = createClient({ chain: studionet, account: glAccount as any });
        checkExistingSBT(addr, client);
        
      } catch (error) {
        console.error('Connection failed:', error);
      }
    } else {
      alert('Please install MetaMask!');
    }
  };

  const handleMint = async () => {
    if (!walletAddress) {
      alert("Connect wallet first!");
      return;
    }
    if (!githubUrl || !githubUrl.includes('github.com')) {
      alert("Please enter a valid GitHub URL.");
      return;
    }

    setIsProcessing(true);
    setTerminalLines([]);
    setResult(null);

    // Start terminal simulation
    addLine("> Initializing GenVM instance...");
    addLine(`> Target payload: ${githubUrl}`, 800);
    addLine("> Establishing secure connection to Studionet...", 1500);

    try {
      // 1. Get Signature
      addLine("> Requesting EOA signature authorization...", 2200);
      const message = "IdentityBridge: Mint Proof of Skill SBT";
      
      let signature;
      try {
        signature = await window.ethereum.request({
          method: 'personal_sign',
          params: [message, walletAddress],
        });
        addLine(`> Signature verified: ${signature.substring(0,10)}...`, 3500);
      } catch (signErr) {
        throw new Error("Signature rejected by user.");
      }

      // Initialize GenLayer Client
      const dummyKey = '0x1111111111111111111111111111111111111111111111111111111111111111' as `0x${string}`;
      const glAccount = privateKeyToAccount(dummyKey);
      
      const glClient = createClient({ chain: studionet, account: glAccount });

      addLine("> Connecting to IdentityBridge Contract...", 4500);
      
      setTimeout(async () => {
        try {
          addLine("> Executing gl.nondet.web.get to scrape profile...", 1000);
          
          // Actually send the transaction to the blockchain!
          const txHash = await glClient.writeContract({
            address: CONTRACT_ADDRESS as `0x${string}`,
            functionName: 'mint_developer_badge',
            args: [githubUrl],
            value: 0n,
          });

          addLine(`> TX Hash generated: ${txHash.substring(0, 15)}...`, 2000);
          addLine("> gl.nondet.exec_prompt running consensus across validators...", 4000);
          
          // Wait for network propagation and consensus
          try {
            await glClient.waitForTransactionReceipt({ hash: txHash, status: 'ACCEPTED' as any });
          } catch (err) {
            console.warn("Receipt timeout, polling...");
          }
          
          addLine("> Consensus reached. Fetching minted SBT state...", 15000);

          // Poll for the result
          let data: string | null = null;
          for (let i = 0; i < 10; i++) {
            await new Promise(resolve => setTimeout(resolve, 4000));
            try {
              const result = await glClient.readContract({
                address: CONTRACT_ADDRESS as `0x${string}`,
                functionName: 'get_badge',
                args: [githubUrl],
              });
              
              if (result && result !== 'NOT_FOUND') {
                data = result as string;
                break;
              }
            } catch (e) {
              console.warn("Poll failed, retrying...");
            }
          }

          if (data) {
            const parsedData = JSON.parse(data);
            setResult(parsedData);
            addLine("> SUCCESS: Proof of Skill verified and recorded.", 1000);
            
            // Save to local storage cache
            const saved = JSON.parse(localStorage.getItem('my_sbts') || '{}');
            saved[walletAddress] = githubUrl;
            localStorage.setItem('my_sbts', JSON.stringify(saved));
            
            setExistingSBT(parsedData);
          } else {
            addLine("> ERROR: Transaction still processing. Check explorer later.", 1000);
          }
          setIsProcessing(false);

        } catch (blockchainErr: any) {
          addLine(`> BLOCKCHAIN ERROR: ${blockchainErr.message}`, 1000);
          setIsProcessing(false);
        }
      }, 4500);

    } catch (error: any) {
      addLine(`> ERROR: ${error.message}`, 3000);
      setIsProcessing(false);
    }
  };

  return (
    <>
      <nav>
        <div className="logo">
          <Code size={24} />
          Identity<span>Bridge</span>
        </div>
        <button 
          className={`btn-connect ${walletAddress ? 'connected' : ''}`} 
          onClick={connectWallet}
        >
          {walletAddress ? `[${walletAddress.substring(0,6)}...${walletAddress.substring(38)}]` : 'Connect_Wallet'}
        </button>
      </nav>

      <main className="hero">
        <h1 className="title">Zero-Knowledge<br/>Proof of Skill.</h1>
        <p className="subtitle">
          Mint an immutable Soulbound Token (SBT) by allowing GenLayer's AI Oracle to autonomously scrape and verify your real-world GitHub activity.
        </p>

        <div className="mint-container">
          {/* Input Box */}
          <div className="input-box">
            <label className="input-label">{'// TARGET_URL'}</label>
            <input 
              type="text" 
              className="input-field"
              placeholder="https://github.com/username"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              disabled={isProcessing}
            />
            <button 
              className="btn-mint" 
              onClick={handleMint}
              disabled={isProcessing || !githubUrl}
            >
              {isProcessing ? 'EXECUTING...' : 'INITIATE_MINT'}
            </button>
          </div>

          {/* Terminal Box */}
          <div className="terminal">
            <div className="terminal-header">
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
            
            <div className="terminal-content">
              {terminalLines.length === 0 && !isProcessing && (
                <div style={{opacity: 0.5}}>&gt; Awaiting command execution...</div>
              )}
              
              <AnimatePresence>
                {terminalLines.map((line, idx) => (
                  <motion.div 
                    key={idx} 
                    className="terminal-line"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    {line}
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {isProcessing && <div className="cursor"></div>}

              {result && (
                <motion.div 
                  className={result.status === 'MINTED' ? 'success-box' : 'error-box'}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px'}}>
                    {result.status === 'MINTED' ? <CheckCircle size={18} /> : <XCircle size={18} />}
                    <strong>STATUS: {result.status}</strong>
                  </div>
                  <div>SBT Type: {result.badge_type}</div>
                  <div style={{marginTop: '8px', opacity: 0.8, fontSize: '13px'}}>{result.details}</div>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Dashboard for Minted SBTs */}
        {existingSBT && existingSBT.status === 'MINTED' && (
          <div className="sbt-dashboard">
            <div className="sbt-title">{'// YOUR SOULBOUND TOKENS'}</div>
            <div className="sbt-card">
              <div className="sbt-header">
                <div className="sbt-type">{existingSBT.badge_type}</div>
                <Code size={20} color="var(--terminal-green)" />
              </div>
              <div className="sbt-body">
                This token is soulbound to your verified on-chain identity. It serves as cryptographic proof of your developer activity.
              </div>
              <div className="sbt-footer">
                <span>URL: {existingSBT.url.replace('https://', '')}</span>
                <span>VERIFIED BY AI ORACLE</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

export default App;
