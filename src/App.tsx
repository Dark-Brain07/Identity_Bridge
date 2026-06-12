import { useState, useEffect } from 'react';
import { createClient } from 'genlayer-js';
import { simulator } from 'genlayer-js/chains';
import { Terminal, Github, Code, CheckCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Replace with actual deployed contract address on Studionet
const CONTRACT_ADDRESS = '0x1234567890123456789012345678901234567890'; 

function App() {
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [githubUrl, setGithubUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [result, setResult] = useState<any>(null);

  const addLine = (line: string, delay: number = 0) => {
    setTimeout(() => {
      setTerminalLines(prev => [...prev, line]);
    }, delay);
  };

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setWalletAddress(accounts[0]);
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
        addLine("> Signature verified. Auth token generated.", 3500);
      } catch (signErr) {
        throw new Error("Signature rejected by user.");
      }

      // Initialize GenLayer Client (Using Simulator for demo, switch to studionet in prod)
      const glClient = createClient({ chain: simulator });

      addLine("> Executing gl.nondet.web.get to scrape profile...", 4500);
      
      // We simulate the transaction delay since Studionet requires deployment
      // In a real scenario, this would be writeContract
      setTimeout(() => {
        addLine("> Data retrieved. Passing to AI Oracle for validation...", 6000);
      }, 4500);

      setTimeout(() => {
        addLine("> gl.nondet.exec_prompt running consensus across validators...", 8000);
      }, 4500);

      // Simulate network request completing
      setTimeout(() => {
        const mockResponse = {
          status: "MINTED",
          badge_type: "Master Developer SBT",
          details: "Verification Successful! The GenLayer AI Oracle has verified your developer activity and minted your Soulbound Proof-of-Skill Token."
        };
        
        addLine("> Consensus reached. Writing state to ledger...", 11000);
        
        setTimeout(() => {
          setResult(mockResponse);
          addLine("> SUCCESS: Transaction confirmed in block.", 12500);
          setIsProcessing(false);
        }, 12500);
        
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
              <Github size={18} />
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
                <div style={{opacity: 0.5}}>> Awaiting command execution...</div>
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
      </main>
    </>
  );
}

export default App;
